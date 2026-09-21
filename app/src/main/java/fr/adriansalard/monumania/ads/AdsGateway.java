package com.kartel99games.monumania.ads;

public interface AdsGateway {
    interface RewardedCallback {
        void onRewardGranted();
        void onClosed();
        void onFailed(String reason);
    }

    interface InterstitialCallback {
        void onClosed();
        void onFailed(String reason);
    }

    boolean isConfigured();
    void showRewarded(String placement, RewardedCallback callback);
    void showInterstitial(String placement, InterstitialCallback callback);
}
