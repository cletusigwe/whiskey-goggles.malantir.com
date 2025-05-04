import type { route as routeFn } from 'ziggy-js';

interface Ort {
    InferenceSession: {
        create(url: string, options?: { executionProviders: string[] }): Promise<any>;
    };
    Tensor: new (type: string, data: Float32Array, dims: number[]) => any;
}

declare global {
    const route: typeof routeFn;
    interface Window {
        ort: Ort;
    }
}