package com.kartel99games.monumania.ads;

import android.app.Activity;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

public final class AdMobAdsGateway implements AdsGateway {

    // IDs TEST officiels Google.
    // Nous mettrons les IDs MONUMANIA réels seulement avant publication.
    private static final String REWARDED_ID =
            "ca-app-pub-3940256099942544/5224354917";

    private static final String INTERSTITIAL_ID =
            "ca-app-pub-3940256099942544/1033173712";

    private final Activity activity;

    private RewardedAd rewardedAd;
    private InterstitialAd interstitialAd;

    private boolean rewardedLoading = false;
    private boolean interstitialLoading = false;

    public AdMobAdsGateway(Activity activity) {
        this.activity = activity;

        MobileAds.initialize(activity, initializationStatus -> {
            loadRewarded();
            loadInterstitial();
        });
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    private void loadRewarded() {
        if (rewardedLoading || rewardedAd != null) {
            return;
        }

        rewardedLoading = true;

        RewardedAd.load(
                activity,
                REWARDED_ID,
                new AdRequest.Builder().build(),
                new RewardedAdLoadCallback() {

                    @Override
                    public void onAdLoaded(@NonNull RewardedAd ad) {
                        rewardedLoading = false;
                        rewardedAd = ad;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        rewardedLoading = false;
                        rewardedAd = null;
                    }
                }
        );
    }

    private void loadInterstitial() {
        if (interstitialLoading || interstitialAd != null) {
            return;
        }

        interstitialLoading = true;

        InterstitialAd.load(
                activity,
                INTERSTITIAL_ID,
                new AdRequest.Builder().build(),
                new InterstitialAdLoadCallback() {

                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd ad) {
                        interstitialLoading = false;
                        interstitialAd = ad;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        interstitialLoading = false;
                        interstitialAd = null;
                    }
                }
        );
    }

    @Override
    public void showRewarded(
            String placement,
            RewardedCallback callback
    ) {
        activity.runOnUiThread(() -> {

            if (rewardedAd == null) {
                loadRewarded();
                callback.onFailed("rewarded_not_ready");
                return;
            }

            RewardedAd ad = rewardedAd;
            rewardedAd = null;

            ad.setFullScreenContentCallback(
                    new FullScreenContentCallback() {

                        @Override
                        public void onAdDismissedFullScreenContent() {
                            callback.onClosed();
                            loadRewarded();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(
                                @NonNull AdError adError
                        ) {
                            callback.onFailed("rewarded_show_failed");
                            loadRewarded();
                        }
                    }
            );

            ad.show(
                    activity,
                    rewardItem -> callback.onRewardGranted()
            );
        });
    }

    @Override
    public void showInterstitial(
            String placement,
            InterstitialCallback callback
    ) {
        activity.runOnUiThread(() -> {

            if (interstitialAd == null) {
                loadInterstitial();
                callback.onFailed("interstitial_not_ready");
                return;
            }

            InterstitialAd ad = interstitialAd;
            interstitialAd = null;

            ad.setFullScreenContentCallback(
                    new FullScreenContentCallback() {

                        @Override
                        public void onAdDismissedFullScreenContent() {
                            callback.onClosed();
                            loadInterstitial();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(
                                @NonNull AdError adError
                        ) {
                            callback.onFailed("interstitial_show_failed");
                            loadInterstitial();
                        }
                    }
            );

            ad.show(activity);
        });
    }
}
