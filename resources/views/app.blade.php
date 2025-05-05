<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark'=> ($appearance ?? 'system') == 'dark'])>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:image" content="{{ config('app.url') }}/ogimage.png">
    <meta name="description" content="Snap, identify, and catalog your whiskey collection">

    <meta property="og:url" content="{{ config('app.url') }}/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Whiskey Goggles">
    <meta property="og:description" content="">
    <meta property="og:image" content="{{ config('app.url') }}/ogimage.png">

    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="whiskey-goggles.malantir.com">
    <meta property="twitter:url" content="{{ config('app.url') }}/">
    <meta name="twitter:title" content="Whiskey Goggles">
    <meta name="twitter:description" content="">
    <meta name="twitter:image" content="{{ config('app.url') }}/ogimage.png">



    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();

    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }

    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>


    <link rel="icon" type="image/x-icon" href="/favicon.ico">



    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">

    {{-- Load onnxruntime-web from CDN --}}
    <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"></script>

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
