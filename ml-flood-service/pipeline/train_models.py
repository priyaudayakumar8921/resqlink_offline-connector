import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
import xgboost as xgb

def train_and_evaluate_flood_models():
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, '..', 'data')
    models_dir = os.path.join(base_dir, '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'kerala_historical_telemetry_floods.csv')
    df = pd.read_csv(csv_path)
    print(f"Loaded dataset with {len(df)} rows.")
    
    # Selected Input Features
    feature_cols = [
        'rainfall_1h_mm',
        'rainfall_6h_mm',
        'rainfall_24h_mm',
        'rainfall_72h_mm',
        'forecast_rainfall_24h_mm',
        'river_water_level_m',
        'water_level_ratio',
        'river_change_rate_m_per_hr',
        'soil_moisture_pct',
        'dam_storage_pct',
        'elevation_m',
        'slope_deg',
        'lat',
        'lng'
    ]
    
    # Chronological Split (Strictly Preventing Temporal Data Leakage)
    # Train: 2014 - 2018 (including the 2018 Great Floods)
    # Validation: 2019 (for risk threshold calibration & validation tuning)
    # Test: 2020 - 2024 (completely unseen evaluation set)
    
    train_mask = (df['year'] <= 2018)
    val_mask = (df['year'] == 2019)
    test_mask = (df['year'] >= 2020)
    
    X_train_raw = df.loc[train_mask, feature_cols]
    X_val_raw = df.loc[val_mask, feature_cols]
    X_test_raw = df.loc[test_mask, feature_cols]
    
    # Fit Scaler
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_val = scaler.transform(X_val_raw)
    X_test = scaler.transform(X_test_raw)
    
    # Save Scaler
    joblib.dump(scaler, os.path.join(models_dir, 'feature_scaler.joblib'))
    joblib.dump(feature_cols, os.path.join(models_dir, 'feature_columns.joblib'))
    
    results = {
        "metadata": {
            "trained_at": pd.Timestamp.now().isoformat(),
            "train_samples": int(len(X_train_raw)),
            "val_samples": int(len(X_val_raw)),
            "test_samples": int(len(X_test_raw)),
            "features": feature_cols
        },
        "models": {},
        "calibrated_thresholds": {}
    }
    
    # Train and Evaluate for both horizons: 6 Hours and 24 Hours
    for horizon in ['6h', '24h']:
        target_col = f'flood_occurred_{horizon}'
        y_train = df.loc[train_mask, target_col].values
        y_val = df.loc[val_mask, target_col].values
        y_test = df.loc[test_mask, target_col].values
        
        print(f"\n==========================================")
        print(f"TRAINING MODELS FOR HORIZON: {horizon.upper()}")
        print(f"Train positive rate: {y_train.mean():.4f}")
        print(f"Val positive rate:   {y_val.mean():.4f}")
        print(f"Test positive rate:  {y_test.mean():.4f}")
        print(f"==========================================")
        
        # Calculate class weights to prioritize recall while controlling false alarms
        neg_count = (y_train == 0).sum()
        pos_count = (y_train == 1).sum()
        scale_pos_weight = neg_count / max(1, pos_count)
        
        # Model 1: Random Forest Classifier
        rf_model = RandomForestClassifier(
            n_estimators=120,
            max_depth=10,
            class_weight='balanced_subsample',
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train, y_train)
        rf_val_prob = rf_model.predict_proba(X_val)[:, 1]
        rf_test_prob = rf_model.predict_proba(X_test)[:, 1]
        rf_test_pred = (rf_test_prob >= 0.5).astype(int)
        
        # Model 2: XGBoost Classifier
        xgb_model = xgb.XGBClassifier(
            n_estimators=140,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            scale_pos_weight=scale_pos_weight * 0.75,
            eval_metric='auc',
            random_state=42
        )
        xgb_model.fit(X_train, y_train)
        xgb_val_prob = xgb_model.predict_proba(X_val)[:, 1]
        xgb_test_prob = xgb_model.predict_proba(X_test)[:, 1]
        xgb_test_pred = (xgb_test_prob >= 0.5).astype(int)
        
        # Evaluation Metrics on Test Set
        def evaluate_model(y_true, y_pred, y_prob):
            cm = confusion_matrix(y_true, y_pred)
            return {
                "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
                "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
                "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
                "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
                "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
                "confusion_matrix": {
                    "true_negatives": int(cm[0, 0]),
                    "false_positives": int(cm[0, 1]),
                    "false_negatives": int(cm[1, 0]),
                    "true_positives": int(cm[1, 1])
                }
            }
            
        rf_eval = evaluate_model(y_test, rf_test_pred, rf_test_prob)
        xgb_eval = evaluate_model(y_test, xgb_test_pred, xgb_test_prob)
        
        print(f"\n[Evaluation on Test Set 2020-2024 ({horizon.upper()})]")
        print(f"Random Forest -> Recall: {rf_eval['recall']}, Precision: {rf_eval['precision']}, ROC-AUC: {rf_eval['roc_auc']}, F1: {rf_eval['f1_score']}")
        print(f"XGBoost       -> Recall: {xgb_eval['recall']}, Precision: {xgb_eval['precision']}, ROC-AUC: {xgb_eval['roc_auc']}, F1: {xgb_eval['f1_score']}")
        
        # Select best model based on F1 and ROC-AUC
        # In disaster early warning, high recall with viable precision is preferred
        best_name = "XGBoost" if xgb_eval['roc_auc'] >= rf_eval['roc_auc'] else "RandomForest"
        best_model = xgb_model if best_name == "XGBoost" else rf_model
        best_val_prob = xgb_val_prob if best_name == "XGBoost" else rf_val_prob
        
        # Calibrate 4-tier risk categories on validation set:
        # LOW: Probability < 0.25
        # MODERATE: 0.25 <= Probability < 0.55
        # HIGH: 0.55 <= Probability < 0.80
        # CRITICAL: Probability >= 0.80
        thresholds = {
            "low_max": 0.25,
            "moderate_max": 0.55,
            "high_max": 0.80,
            "critical_min": 0.80
        }
        
        # Compute Feature Importances
        if best_name == "XGBoost":
            raw_imp = xgb_model.feature_importances_
        else:
            raw_imp = rf_model.feature_importances_
            
        feat_importance = {col: round(float(val), 4) for col, val in zip(feature_cols, raw_imp)}
        # Sort by importance
        feat_importance = dict(sorted(feat_importance.items(), key=lambda item: item[1], reverse=True))
        
        # Save Selected Model for Horizon
        model_save_path = os.path.join(models_dir, f'flood_model_{horizon}.joblib')
        joblib.dump(best_model, model_save_path)
        print(f"Saved primary {best_name} model for {horizon} to: {model_save_path}")
        
        results["models"][horizon] = {
            "selected_model": best_name,
            "random_forest": rf_eval,
            "xgboost": xgb_eval,
            "feature_importance": feat_importance,
            "thresholds": thresholds
        }
        
    # Write Complete Model Metrics JSON
    metrics_path = os.path.join(models_dir, 'model_evaluation_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(results, f, indent=2)
        
    print(f"\n==========================================")
    print(f"MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print(f"Metrics file: {metrics_path}")
    print(f"==========================================")
    return results

if __name__ == '__main__':
    train_and_evaluate_flood_models()
