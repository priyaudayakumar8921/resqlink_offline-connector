package com.resqlink.network;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Log;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;

public class HubDiscoverer {
    private static final String TAG = "HubDiscoverer";
    private static final int DISCOVERY_PORT = 41144;
    private static volatile boolean isDiscovering = false;
    private static Thread discoveryThread = null;
    private static WifiManager.MulticastLock multicastLock = null;

    public static synchronized void startDiscovery(Context context) {
        if (isDiscovering) return;
        isDiscovering = true;

        Context appContext = context.getApplicationContext();

        discoveryThread = new Thread(() -> {
            try {
                // Acquire Wi-Fi MulticastLock on Android to allow broadcast reception
                try {
                    WifiManager wifi = (WifiManager) appContext.getSystemService(Context.WIFI_SERVICE);
                    if (wifi != null) {
                        multicastLock = wifi.createMulticastLock("ResQLinkUDPDiscovery");
                        multicastLock.setReferenceCounted(true);
                        multicastLock.acquire();
                        Log.d(TAG, "MulticastLock acquired for UDP Hub Discovery");
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Could not acquire MulticastLock", e);
                }

                DatagramSocket socket = new DatagramSocket(null);
                socket.setReuseAddress(true);
                socket.setBroadcast(true);
                socket.bind(new InetSocketAddress(DISCOVERY_PORT));
                socket.setSoTimeout(3000); // 3 second timeout for loop checking

                byte[] buffer = new byte[256];
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

                Log.d(TAG, "Listening for Hub UDP Broadcasts on port " + DISCOVERY_PORT + "...");

                while (isDiscovering) {
                    try {
                        socket.receive(packet);
                        String message = new String(packet.getData(), 0, packet.getLength()).trim();

                        if (message.startsWith("RESQLINK_HUB:")) {
                            String serverIp = packet.getAddress().getHostAddress();
                            String[] parts = message.split(":");
                            String port = parts.length > 1 ? parts[1] : "3000";
                            String newUrl = "http://" + serverIp + ":" + port + "/api/v1";

                            Log.d(TAG, "UDP Discovered Hub at: " + newUrl);

                            // Update HubConnectionManager
                            HubConnectionManager.getInstance(appContext).setHubUrl(newUrl, appContext);
                        }
                    } catch (java.net.SocketTimeoutException te) {
                        // Expected periodic timeout, keeps thread responsive to isDiscovering flag
                    } catch (Exception e) {
                        if (isDiscovering) {
                            Log.w(TAG, "UDP read error, continuing: " + e.getMessage());
                            Thread.sleep(1000);
                        }
                    }
                }

                socket.close();
            } catch (Exception e) {
                Log.e(TAG, "UDP Discovery Error", e);
            } finally {
                releaseMulticastLock();
                isDiscovering = false;
            }
        });

        discoveryThread.setDaemon(true);
        discoveryThread.start();
    }

    public static synchronized void stopDiscovery() {
        isDiscovering = false;
        if (discoveryThread != null) {
            discoveryThread.interrupt();
            discoveryThread = null;
        }
        releaseMulticastLock();
    }

    private static void releaseMulticastLock() {
        try {
            if (multicastLock != null && multicastLock.isHeld()) {
                multicastLock.release();
                multicastLock = null;
                Log.d(TAG, "MulticastLock released");
            }
        } catch (Exception ignored) {}
    }
}
