import os
import zipfile
import json
import time
import numpy as np
import pandas as pd

RAW_LABELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
LABEL_MAP = {raw: idx for idx, raw in enumerate(RAW_LABELS)}
CHAR_MAP = {idx: chr(ord('A') + raw) for idx, raw in enumerate(RAW_LABELS)}

def load_data(zip_path):
    print(f"[*] Loading data from {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as z:
        with z.open('sign_mnist_train.csv') as f:
            train_df = pd.read_csv(f)
        with z.open('sign_mnist_test.csv') as f:
            test_df = pd.read_csv(f)

    y_train_raw = train_df['label'].values
    X_train = train_df.drop('label', axis=1).values.astype(np.float32) / 255.0

    y_test_raw = test_df['label'].values
    X_test = test_df.drop('label', axis=1).values.astype(np.float32) / 255.0

    y_train = np.array([LABEL_MAP[y] for y in y_train_raw], dtype=np.int64)
    y_test = np.array([LABEL_MAP[y] for y in y_test_raw], dtype=np.int64)

    return X_train, y_train, X_test, y_test

def softmax(x):
    exps = np.exp(x - np.max(x, axis=1, keepdims=True))
    return exps / np.sum(exps, axis=1, keepdims=True)

def relu(x):
    return np.maximum(0, x)

def relu_deriv(x):
    return (x > 0).astype(np.float32)

class FastSignMLP:
    def __init__(self, input_dim=784, hidden1=256, hidden2=128, num_classes=24):
        np.random.seed(42)
        self.W1 = np.random.randn(input_dim, hidden1).astype(np.float32) * np.sqrt(2.0 / input_dim)
        self.b1 = np.zeros((1, hidden1), dtype=np.float32)
        
        self.W2 = np.random.randn(hidden1, hidden2).astype(np.float32) * np.sqrt(2.0 / hidden1)
        self.b2 = np.zeros((1, hidden2), dtype=np.float32)

        self.W3 = np.random.randn(hidden2, num_classes).astype(np.float32) * np.sqrt(2.0 / hidden2)
        self.b3 = np.zeros((1, num_classes), dtype=np.float32)

    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = relu(self.z1)
        
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = relu(self.z2)

        self.z3 = np.dot(self.a2, self.W3) + self.b3
        self.probs = softmax(self.z3)
        return self.probs

    def train_epoch(self, X, y, lr=0.01, batch_size=128):
        indices = np.arange(len(X))
        np.random.shuffle(indices)
        num_classes = self.W3.shape[1]

        total_loss = 0.0
        correct = 0

        for start in range(0, len(X), batch_size):
            end = min(start + batch_size, len(X))
            batch_idx = indices[start:end]
            X_b = X[batch_idx]
            y_b = y[batch_idx]
            m = len(X_b)

            # Forward
            probs = self.forward(X_b)

            # Loss (Cross-Entropy)
            log_probs = -np.log(np.clip(probs[np.arange(m), y_b], 1e-10, 1.0))
            total_loss += np.sum(log_probs)
            preds = np.argmax(probs, axis=1)
            correct += np.sum(preds == y_b)

            # Backward
            dz3 = probs.copy()
            dz3[np.arange(m), y_b] -= 1.0
            dz3 /= m

            dW3 = np.dot(self.a2.T, dz3)
            db3 = np.sum(dz3, axis=0, keepdims=True)

            da2 = np.dot(dz3, self.W3.T)
            dz2 = da2 * relu_deriv(self.z2)

            dW2 = np.dot(self.a1.T, dz2)
            db2 = np.sum(dz2, axis=0, keepdims=True)

            da1 = np.dot(dz2, self.W2.T)
            dz1 = da1 * relu_deriv(self.z1)

            dW1 = np.dot(X_b.T, dz1)
            db1 = np.sum(dz1, axis=0, keepdims=True)

            # Gradient update with simple momentum / SGD
            self.W3 -= lr * dW3
            self.b3 -= lr * db3
            self.W2 -= lr * dW2
            self.b2 -= lr * db2
            self.W1 -= lr * dW1
            self.b1 -= lr * db1

        return total_loss / len(X), correct / len(X)

    def evaluate(self, X, y):
        probs = self.forward(X)
        preds = np.argmax(probs, axis=1)
        m = len(X)
        log_probs = -np.log(np.clip(probs[np.arange(m), y], 1e-10, 1.0))
        loss = np.mean(log_probs)
        acc = np.mean(preds == y)
        return loss, acc, preds

def run_numpy_training():
    zip_path = r"d:\Antigravity\SupSonic\Resources\archive.zip"
    output_dir = r"d:\Antigravity\SupSonic\models\sign_mnist_trained"
    os.makedirs(output_dir, exist_ok=True)

    X_train, y_train, X_test, y_test = load_data(zip_path)
    print(f"[+] Loaded {len(X_train)} train, {len(X_test)} test examples.", flush=True)

    model = FastSignMLP(input_dim=784, hidden1=512, hidden2=256, num_classes=24)
    epochs = 20
    lr = 0.05

    print("\n--- Training Vectorized Neural Network on Sign Language Dataset ---", flush=True)
    start_time = time.time()
    for epoch in range(1, epochs + 1):
        # Cosine decay lr
        cur_lr = lr * 0.5 * (1 + np.cos(np.pi * (epoch - 1) / epochs))
        train_loss, train_acc = model.train_epoch(X_train, y_train, lr=cur_lr, batch_size=128)
        val_loss, val_acc, _ = model.evaluate(X_test, y_test)
        print(f"Epoch [{epoch:02d}/{epochs:02d}] Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}% || Val Loss: {val_loss:.4f}, Val Acc: {val_acc*100:.2f}%", flush=True)

    elapsed = time.time() - start_time
    _, final_acc, test_preds = model.evaluate(X_test, y_test)
    print(f"\n[+] Training finished in {elapsed:.2f}s! Final Test Accuracy: {final_acc*100:.2f}%", flush=True)

    # Save weights and biases as JSON and NumPy binary
    weights = {
        'W1': model.W1.tolist(), 'b1': model.b1.tolist(),
        'W2': model.W2.tolist(), 'b2': model.b2.tolist(),
        'W3': model.W3.tolist(), 'b3': model.b3.tolist(),
        'classes': [CHAR_MAP[i] for i in range(24)],
        'raw_labels': RAW_LABELS,
        'accuracy': float(final_acc)
    }
    with open(os.path.join(output_dir, "sign_mnist_mlp_weights.json"), "w") as f:
        json.dump(weights, f)

    np.savez_compressed(
        os.path.join(output_dir, "sign_mnist_mlp_weights.npz"),
        W1=model.W1, b1=model.b1,
        W2=model.W2, b2=model.b2,
        W3=model.W3, b3=model.b3,
        accuracy=np.array([final_acc])
    )

    print(f"[✓] Saved model weights to: {output_dir}/sign_mnist_mlp_weights.json & .npz", flush=True)

    # Show first 10 predictions
    print("\n--- Test Set Sample Verifications ---", flush=True)
    for i in range(10):
        actual = CHAR_MAP[y_test[i]]
        pred = CHAR_MAP[test_preds[i]]
        res = "✓ CORRECT" if actual == pred else "✗ INCORRECT"
        print(f"Sample #{i+1:02d}: Actual Sign='{actual}' | Model Predicted='{pred}' -> {res}", flush=True)

if __name__ == '__main__':
    run_numpy_training()
