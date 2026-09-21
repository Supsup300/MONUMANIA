package com.kartel99games.monumania.consent;

public final class NoOpConsentGateway implements ConsentGateway {
    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public void requestIfRequired(Callback callback) {
        callback.onComplete("simulation_no_consent_required");
    }
}
