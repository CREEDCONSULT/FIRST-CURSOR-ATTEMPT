export type TelemetryParams = {
    zipParseTimeMs?: number;
    jsonFileCount?: number;
    followersCount?: number;
    followingCount?: number;
};

class TelemetryStore {
    private listeners: Set<() => void> = new Set();
    private stats: TelemetryParams = {};

    getDetails() {
        return this.stats;
    }

    update(params: TelemetryParams) {
        this.stats = { ...this.stats, ...params };
        this.notify();
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach((l) => l());
    }
}

export const telemetry = new TelemetryStore();
