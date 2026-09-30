import os
import io
import time
import zipfile
import json
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

# --- Class Mapping (24 ASL / ISL Sign Alphabet gestures) ---
# Classes in dataset: 0-8 (A-I), 10-24 (K-Y). J(9) and Z(25) are omitted because they require dynamic motion.
RAW_LABELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
LABEL_MAP = {raw: idx for idx, raw in enumerate(RAW_LABELS)}
INV_LABEL_MAP = {idx: raw for idx, raw in enumerate(RAW_LABELS)}
CHAR_MAP = {idx: chr(ord('A') + raw) for idx, raw in enumerate(RAW_LABELS)}

class SignMNISTDataset(Dataset):
    def __init__(self, images, labels, transform=None):
        self.images = images
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        img = self.images[idx].reshape(28, 28).astype(np.uint8)
        label = self.labels[idx]
        if self.transform:
            img = self.transform(img)
        else:
            img = transforms.ToTensor()(img)
        return img, torch.tensor(label, dtype=torch.long)

class SignLanguageCNN(nn.Module):
    def __init__(self, num_classes=24):
        super(SignLanguageCNN, self).__init__()
        self.features = nn.Sequential(
            # Block 1: 28x28 -> 14x14
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.2),

            # Block 2: 14x14 -> 7x7
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.2),

            # Block 3: 7x7 -> 3x3
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.25)
        )
        self.classifier = nn.Sequential(
            nn.Linear(128 * 3 * 3, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

def load_data_from_zip(zip_path):
    print(f"[*] Extracting Sign MNIST dataset from {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as z:
        with z.open('sign_mnist_train.csv') as f:
            train_df = pd.read_csv(f)
        with z.open('sign_mnist_test.csv') as f:
            test_df = pd.read_csv(f)

    y_train_raw = train_df['label'].values
    X_train = train_df.drop('label', axis=1).values.astype(np.uint8)

    y_test_raw = test_df['label'].values
    X_test = test_df.drop('label', axis=1).values.astype(np.uint8)

    # Remap labels to 0..23
    y_train = np.array([LABEL_MAP[y] for y in y_train_raw], dtype=np.int64)
    y_test = np.array([LABEL_MAP[y] for y in y_test_raw], dtype=np.int64)

    print(f"[+] Loaded {len(X_train)} training samples and {len(X_test)} test samples across {len(LABEL_MAP)} gesture classes.")
    return X_train, y_train, X_test, y_test

def train_model(zip_path, output_dir, epochs=15, batch_size=128, lr=0.001):
    os.makedirs(output_dir, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[*] Training on device: {device}")

    X_train, y_train, X_test, y_test = load_data_from_zip(zip_path)

    # Data augmentation for robust gesture recognition
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.RandomRotation(degrees=12),
        transforms.RandomResizedCrop(28, scale=(0.88, 1.0)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])

    test_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])

    train_dataset = SignMNISTDataset(X_train, y_train, transform=train_transform)
    test_dataset = SignMNISTDataset(X_test, y_test, transform=test_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    model = SignLanguageCNN(num_classes=len(LABEL_MAP)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}

    print("\n=======================================================")
    print("  Starting Sign Language CNN Training Loop")
    print("=======================================================")

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * batch_x.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += (preds == batch_y).sum().item()
            total_train += batch_y.size(0)

        scheduler.step()
        epoch_train_loss = running_loss / total_train
        epoch_train_acc = correct_train / total_train

        # Validation
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for batch_x, batch_y in test_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item() * batch_x.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += (preds == batch_y).sum().item()
                total_val += batch_y.size(0)

        epoch_val_loss = val_loss / total_val
        epoch_val_acc = correct_val / total_val

        history['train_loss'].append(epoch_train_loss)
        history['train_acc'].append(epoch_train_acc)
        history['val_loss'].append(epoch_val_loss)
        history['val_acc'].append(epoch_val_acc)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] "
              f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc*100:.2f}% "
              f"|| Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc*100:.2f}%")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_model_path = os.path.join(output_dir, "sign_language_best.pth")
            torch.save(model.state_dict(), best_model_path)

    elapsed = time.time() - start_time
    print(f"\n[+] Training completed in {elapsed:.1f}s. Best Validation Accuracy: {best_val_acc*100:.2f}%")

    # Load best model for evaluation & export
    model.load_state_dict(torch.load(os.path.join(output_dir, "sign_language_best.pth")))
    model.eval()

    # Save final model checkpoints & metadata
    metadata = {
        'num_classes': len(LABEL_MAP),
        'classes': [CHAR_MAP[i] for i in range(len(LABEL_MAP))],
        'raw_labels': RAW_LABELS,
        'label_to_char': {str(idx): CHAR_MAP[idx] for idx in range(len(LABEL_MAP))},
        'best_test_accuracy': float(best_val_acc),
        'trained_at': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        'model_architecture': 'SignLanguageCNN-3Conv-2Linear'
    }
    with open(os.path.join(output_dir, "model_metadata.json"), 'w') as f:
        json.dump(metadata, f, indent=2)

    # Export ONNX model for universal deployment (Web/Node/Python/C++)
    try:
        dummy_input = torch.randn(1, 1, 28, 28, device=device)
        onnx_path = os.path.join(output_dir, "sign_language_model.onnx")
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['input_image'],
            output_names=['class_logits'],
            dynamic_axes={'input_image': {0: 'batch_size'}, 'class_logits': {0: 'batch_size'}}
        )
        print(f"[+] Exported universal ONNX model to: {onnx_path}")
    except Exception as e:
        print(f"[-] ONNX export note: {e}")

    # Generate test classification sample predictions
    print("\n--- Sample Test Predictions ---")
    with torch.no_grad():
        for i in range(min(12, len(X_test))):
            sample_img = test_transform(X_test[i].reshape(28, 28).astype(np.uint8)).unsqueeze(0).to(device)
            logits = model(sample_img)
            pred_idx = torch.argmax(logits, dim=1).item()
            actual_idx = y_test[i]
            match = "✓ MATCH" if pred_idx == actual_idx else "✗ MISMATCH"
            print(f"Sample #{i+1:02d}: Actual='{CHAR_MAP[actual_idx]}' ({actual_idx}) | Predicted='{CHAR_MAP[pred_idx]}' ({pred_idx}) -> {match}")

    print(f"\n[✓] All model artifacts saved to: {output_dir}")
    return metadata

if __name__ == '__main__':
    zip_path = r"d:\Antigravity\SupSonic\Resources\archive.zip"
    output_dir = r"d:\Antigravity\SupSonic\models\sign_mnist_trained"
    train_model(zip_path, output_dir, epochs=15, batch_size=128, lr=0.001)
