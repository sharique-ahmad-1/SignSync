import os
import zipfile
import json
import numpy as np
import pandas as pd

RAW_LABELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
LABEL_MAP = {raw: idx for idx, raw in enumerate(RAW_LABELS)}
CHAR_MAP = {idx: chr(ord('A') + raw) for idx, raw in enumerate(RAW_LABELS)}

def softmax(x):
    exps = np.exp(x - np.max(x, axis=1, keepdims=True))
    return exps / np.sum(exps, axis=1, keepdims=True)

def relu(x):
    return np.maximum(0, x)

def evaluate_saved_model():
    weights_path = r"d:\Antigravity\SupSonic\models\sign_mnist_trained\sign_mnist_mlp_weights.npz"
    zip_path = r"d:\Antigravity\SupSonic\Resources\archive.zip"

    print(f"[*] Loading model weights from: {weights_path}")
    data = np.load(weights_path)
    W1, b1 = data['W1'], data['b1']
    W2, b2 = data['W2'], data['b2']
    W3, b3 = data['W3'], data['b3']

    print(f"[*] Loading test data from: {zip_path}")
    with zipfile.ZipFile(zip_path, 'r') as z:
        with z.open('sign_mnist_test.csv') as f:
            test_df = pd.read_csv(f)

    y_test_raw = test_df['label'].values
    X_test = test_df.drop('label', axis=1).values.astype(np.float32) / 255.0
    y_test = np.array([LABEL_MAP[y] for y in y_test_raw], dtype=np.int64)

    # Forward pass
    z1 = np.dot(X_test, W1) + b1
    a1 = relu(z1)
    z2 = np.dot(a1, W2) + b2
    a2 = relu(z2)
    z3 = np.dot(a2, W3) + b3
    probs = softmax(z3)
    preds = np.argmax(probs, axis=1)

    overall_acc = np.mean(preds == y_test)
    print(f"\n=======================================================")
    print(f"  SIGN LANGUAGE MODEL EVALUATION REPORT")
    print(f"  Total Test Samples: {len(X_test)}")
    print(f"  Overall Top-1 Test Accuracy: {overall_acc*100:.2f}%")
    print(f"=======================================================\n")

    print(f"{'Class':<6} | {'Letter':<8} | {'Total':<8} | {'Correct':<8} | {'Accuracy':<10}")
    print("-" * 50)
    for class_idx in range(len(LABEL_MAP)):
        mask = (y_test == class_idx)
        total_class = np.sum(mask)
        correct_class = np.sum(preds[mask] == class_idx)
        acc_class = (correct_class / total_class * 100) if total_class > 0 else 0.0
        letter = CHAR_MAP[class_idx]
        print(f"{class_idx:<6} | {letter:<8} | {total_class:<8} | {correct_class:<8} | {acc_class:>6.2f}%")

    print("\n--- First 20 Test Image Inferences ---")
    for i in range(20):
        actual_char = CHAR_MAP[y_test[i]]
        pred_char = CHAR_MAP[preds[i]]
        conf = probs[i, preds[i]] * 100
        match = "[MATCH]" if actual_char == pred_char else "[MISMATCH]"
        print(f"Sample #{i+1:02d}: Ground Truth='{actual_char}' | Predicted='{pred_char}' ({conf:.1f}% conf) -> {match}")

if __name__ == '__main__':
    evaluate_saved_model()
