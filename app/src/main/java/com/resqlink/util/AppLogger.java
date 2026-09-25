package com.resqlink.util;

import android.util.Log;

public class AppLogger {
    private static final boolean ENABLE_LOGGING = true;

    public static void d(String tag, String message) {
        if (ENABLE_LOGGING) {
            Log.d(tag, message);
        }
    }

    public static void e(String tag, String message) {
        if (ENABLE_LOGGING) {
            Log.e(tag, message);
        }
    }
    
    public static void e(String tag, String message, Throwable t) {
        if (ENABLE_LOGGING) {
            Log.e(tag, message, t);
        }
    }
}
