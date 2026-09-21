package com.kartel99games.monumania.ads;

public final class NoOpAdsGateway implements AdsGateway {
    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public void showRewarded(String placement, RewardedCallback callback) {
        callback.onFailed("ad_sdk_not_configured");
    }

    @Override
    public void showInterstitial(String placement, InterstitialCallback callback) {
        callback.onFailed("ad_sdk_not_configured");
    }
}
