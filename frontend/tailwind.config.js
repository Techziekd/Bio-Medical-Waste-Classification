/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                disposable: "#22D3EE",
                pathological: "#FBBF24",
                sharps: "#FB7185",
                radioactive: "#818CF8",
                brandDark: "#0B0F1A",
            }
        },
    },
    plugins: [],
}
