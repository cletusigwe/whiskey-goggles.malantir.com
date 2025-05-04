import { get, set } from 'idb-keyval';

export interface DownloadProgress {
    loaded: number;
    total: number;
}

export const cacheModelAssets = async (onProgress: (progress: DownloadProgress, assetName: string) => void): Promise<void> => {
    const assets = [
        { key: 'model', url: '/onnx/model.onnx', type: 'blob', name: 'model.onnx' },
        { key: 'labels', url: '/onnx/labels.json', type: 'json', name: 'labels.json' },
        { key: 'mean_std', url: '/onnx/mean_std.json', type: 'json', name: 'mean_std.json' },
    ];

    for (const asset of assets) {
        const cached = await get(asset.key);
        if (cached) continue;

        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', asset.url, true);
            xhr.responseType = asset.type === 'blob' ? 'blob' : 'json';

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgress({ loaded: event.loaded, total: event.total }, asset.name);
                } else {
                    onProgress({ loaded: event.loaded, total: 0 }, asset.name); // Indeterminate progress
                }
            };

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    const data = asset.type === 'blob' ? xhr.response : xhr.response;
                    await set(asset.key, data);
                    resolve();
                } else {
                    reject(new Error(`Failed to download ${asset.name} (status: ${xhr.status})`));
                }
            };

            xhr.onerror = () => reject(new Error(`Network error while downloading ${asset.name}`));
            xhr.send();
        });
    }
};

export const getCachedAsset = async (key: string): Promise<Blob | any> => {
    const data = await get(key);
    if (!data) {
        throw new Error(`${key} not found in cache`);
    }
    return data;
};

export const isModelCached = async (): Promise<boolean> => {
    const keys = ['model', 'labels', 'mean_std'];
    for (const key of keys) {
        if (!(await get(key))) {
            return false;
        }
    }
    return true;
};
