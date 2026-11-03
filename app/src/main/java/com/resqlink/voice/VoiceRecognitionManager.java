package com.resqlink.voice;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VoiceRecognitionManager implements RecognitionListener {

    private static final String TAG = "VoiceRecognitionMgr";
    private static final String MODEL_ASSET_DIR = "model-en";
    private static final String MODEL_TARGET_DIR = "vosk-model-en";

    public interface VoiceRecognitionCallback {
        void onReady();
        void onResult(String text);
        void onPartialResult(String text);
        void onError(Exception e);
        void onStateChanged(String state);
        void onFinalDelivered();
    }

    private Model model;
    private SpeechService speechService;
    private final VoiceRecognitionCallback callback;
    private final Context context;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private boolean isStopping = false;

    public VoiceRecognitionManager(Context context, VoiceRecognitionCallback callback) {
        this.context = context.getApplicationContext();
        this.callback = callback;
    }

    // ─── Model Initialisation ─────────────────────────────────────────────────

    public void initModel() {
        callback.onStateChanged("INITIALIZING");

        executor.execute(() -> {
            try {
                // Set Vosk native logging so errors appear in Logcat
                try {
                    LibVosk.setLogLevel(LogLevel.INFO);
                } catch (Throwable t) {
                    Log.w(TAG, "Could not set Vosk log level: " + t.getMessage());
                }

                File targetDir = new File(context.getFilesDir(), MODEL_TARGET_DIR);
                Log.d(TAG, "Target model path: " + targetDir.getAbsolutePath());

                // Verify if model is already unpacked and valid
                if (!isModelValid(targetDir)) {
                    Log.i(TAG, "Unpacking model from assets/" + MODEL_ASSET_DIR + " to " + targetDir.getAbsolutePath());
                    if (targetDir.exists()) {
                        deleteRecursive(targetDir);
                    }
                    if (!targetDir.mkdirs()) {
                        Log.w(TAG, "mkdirs returned false or dir exists for " + targetDir.getAbsolutePath());
                    }

                    copyAssetFolder(context.getAssets(), MODEL_ASSET_DIR, targetDir);

                    if (!isModelValid(targetDir)) {
                        throw new IOException("Model unpacking completed, but critical files are missing or incomplete in " + targetDir.getAbsolutePath());
                    }
                    Log.i(TAG, "Model unpacked and verified successfully.");
                } else {
                    Log.i(TAG, "Cached model is intact. Skipping unpack.");
                }

                // Load native Vosk model
                Log.d(TAG, "Loading native Vosk model from: " + targetDir.getAbsolutePath());
                Model loadedModel = new Model(targetDir.getAbsolutePath());
                this.model = loadedModel;

                mainHandler.post(callback::onReady);

            } catch (Exception e) {
                Log.e(TAG, "Error initializing Vosk model: " + e.getMessage(), e);
                mainHandler.post(() -> callback.onError(new Exception("Voice model initialization failed: " + e.getMessage(), e)));
            }
        });
    }

    private boolean isModelValid(File modelDir) {
        if (!modelDir.exists() || !modelDir.isDirectory()) {
            return false;
        }
        File amFile = new File(modelDir, "am/final.mdl");
        File graphFile = new File(modelDir, "graph/Gr.fst");
        File hclrFile = new File(modelDir, "graph/HCLr.fst");
        File confFile = new File(modelDir, "conf/model.conf");

        // Check essential files exist and have non-zero size
        return amFile.exists() && amFile.length() > 5000000
                && graphFile.exists() && graphFile.length() > 5000000
                && hclrFile.exists() && hclrFile.length() > 5000000
                && confFile.exists();
    }

    private void copyAssetFolder(AssetManager assetManager, String fromAssetPath, File toDir) throws IOException {
        String[] files = assetManager.list(fromAssetPath);
        if (files == null || files.length == 0) {
            // It's a file
            copyAssetFile(assetManager, fromAssetPath, toDir);
        } else {
            // It's a directory
            if (!toDir.exists()) {
                toDir.mkdirs();
            }
            for (String file : files) {
                String subAsset = fromAssetPath + "/" + file;
                File subDest = new File(toDir, file);
                String[] subFiles = assetManager.list(subAsset);
                if (subFiles != null && subFiles.length > 0) {
                    copyAssetFolder(assetManager, subAsset, subDest);
                } else {
                    copyAssetFile(assetManager, subAsset, subDest);
                }
            }
        }
    }

    private void copyAssetFile(AssetManager assetManager, String assetPath, File destFile) throws IOException {
        File parent = destFile.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        try (InputStream in = assetManager.open(assetPath);
             OutputStream out = new FileOutputStream(destFile)) {
            byte[] buffer = new byte[65536]; // 64 KB buffer for fast copying
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
        }
    }

    private void deleteRecursive(File f) {
        if (f.isDirectory()) {
            File[] children = f.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        f.delete();
    }

    // ─── Listening Control ────────────────────────────────────────────────────

    public boolean isListening() {
        return speechService != null && !isStopping;
    }

    public void startListening() {
        if (model == null) {
            callback.onError(new Exception("Speech model not initialized yet. Please wait."));
            return;
        }
        isStopping = false;
        try {
            if (speechService != null) {
                speechService.stop();
                speechService.shutdown();
                speechService = null;
            }
            Recognizer rec = new Recognizer(model, 16000.0f);
            speechService = new SpeechService(rec, 16000.0f);
            speechService.startListening(this);
            Log.d(TAG, "SpeechService started listening");
            callback.onStateChanged("LISTENING");
        } catch (IOException e) {
            Log.e(TAG, "startListening failed: " + e.getMessage(), e);
            callback.onError(e);
        }
    }

    public void stopListening() {
        if (speechService != null && !isStopping) {
            isStopping = true;
            Log.d(TAG, "Stopping SpeechService (will wait for onFinalResult)");
            speechService.stop();
            callback.onStateChanged("IDLE");
        }
    }

    public void destroy() {
        isStopping = true;
        if (speechService != null) {
            speechService.stop();
            speechService.shutdown();
            speechService = null;
        }
        if (model != null) {
            model.close();
            model = null;
        }
        executor.shutdown();
    }

    // ─── RecognitionListener callbacks ───────────────────────────────────────

    @Override
    public void onPartialResult(String hypothesis) {
        if (hypothesis == null || hypothesis.isEmpty()) return;
        String text = extractJsonText(hypothesis, "partial");
        if (!text.isEmpty()) {
            Log.d(TAG, "Partial: " + text);
            callback.onPartialResult(text);
        }
    }

    @Override
    public void onResult(String hypothesis) {
        if (hypothesis == null || hypothesis.isEmpty()) return;
        String text = extractJsonText(hypothesis, "text");
        if (!text.isEmpty()) {
            Log.d(TAG, "Result: " + text);
            callback.onResult(text);
        }
    }

    @Override
    public void onFinalResult(String hypothesis) {
        Log.d(TAG, "FinalResult: " + hypothesis);
        if (hypothesis != null && !hypothesis.isEmpty()) {
            String text = extractJsonText(hypothesis, "text");
            if (!text.isEmpty()) {
                callback.onResult(text);
            }
        }
        if (speechService != null) {
            speechService.shutdown();
            speechService = null;
        }
        isStopping = false;
        callback.onFinalDelivered();
    }

    @Override
    public void onError(Exception e) {
        Log.e(TAG, "Vosk onError: " + e.getMessage(), e);
        isStopping = false;
        if (speechService != null) {
            speechService.shutdown();
            speechService = null;
        }
        callback.onError(e);
    }

    @Override
    public void onTimeout() {
        Log.d(TAG, "Vosk timeout");
        callback.onStateChanged("TIMEOUT");
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private String extractJsonText(String json, String key) {
        try {
            org.json.JSONObject obj = new org.json.JSONObject(json);
            return obj.optString(key, "").trim();
        } catch (Exception e) {
            return "";
        }
    }
}
