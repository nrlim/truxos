"use client";

import dynamic from "next/dynamic";

const MapPickerClient = dynamic(() => import("./MapPickerClient"), {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 font-medium">Memuat Peta...</div>
});

export default function MapPicker(props: any) {
    return <MapPickerClient {...props} />;
}
