"use client";

import { useState, useEffect } from "react";
import { getReportData, getReportFilterOptions } from "@/actions/reports";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/reports/ReportPDF";
import { FileText, FileSpreadsheet, Loader2, Filter, ChevronDown, DownloadCloud } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
};

export default function ReportViewClient({ tenantId, username }: { tenantId: string; username: string }) {
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [truckTypes, setTruckTypes] = useState<string[]>([]);
    const [drivers, setDrivers] = useState<{ id: string; fullName: string }[]>([]);

    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        truckType: "",
        driverId: "",
    });

    const [reportData, setReportData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [hasQueried, setHasQueried] = useState(false);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const res = await getReportFilterOptions(tenantId);
                setTruckTypes(res.truckTypes);
                setDrivers(res.drivers);
            } catch (err) {
                console.error("Failed to load filter options", err);
            } finally {
                setLoadingFilters(false);
            }
        }
        fetchOptions();
    }, [tenantId]);

    const handlePreview = async () => {
        setLoadingData(true);
        setHasQueried(true);
        try {
            const data = await getReportData({
                tenantId,
                startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                endDate: filters.endDate ? new Date(filters.endDate) : undefined,
                truckType: filters.truckType || undefined,
                driverId: filters.driverId || undefined,
            });
            setReportData(data);
            if (!data) toast.error("No completed manifests found for these filters.");
        } catch (error) {
            toast.error("Failed to generate report data.");
            console.error(error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleDownloadExcel = () => {
        const queryParams = new URLSearchParams();
        queryParams.append("tenantId", tenantId);
        queryParams.append("generatedBy", username);
        if (filters.startDate) queryParams.append("startDate", filters.startDate);
        if (filters.endDate) queryParams.append("endDate", filters.endDate);
        if (filters.truckType) queryParams.append("truckType", filters.truckType);
        if (filters.driverId) queryParams.append("driverId", filters.driverId);

        const url = `/api/reports/excel?${queryParams.toString()}`;
        window.open(url, "_blank");
    };

    return (
        <div className="flex flex-col gap-6">
            {/* FILTER SECTION */}
            <div className="bg-white border border-neutral-200 rounded-sm shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-4">
                    <Filter className="w-5 h-5 text-neutral-500" />
                    <h2 className="text-lg font-semibold text-neutral-800">Report Parameters</h2>
                </div>
                {loadingFilters ? (
                    <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Start Date</label>
                            <input
                                type="date"
                                className="border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-950 focus:border-blue-950 outline-none"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">End Date</label>
                            <input
                                type="date"
                                className="border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-950 focus:border-blue-950 outline-none"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 relative">
                            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Truck Type</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-950 focus:border-blue-950 outline-none bg-white"
                                    value={filters.truckType}
                                    onChange={(e) => setFilters(prev => ({ ...prev, truckType: e.target.value }))}
                                >
                                    <option value="">All Types</option>
                                    {truckTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 relative">
                            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Driver</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-950 focus:border-blue-950 outline-none bg-white"
                                    value={filters.driverId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
                                >
                                    <option value="">All Drivers</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                )}
                <div className="pt-2 flex justify-end">
                    <button
                        onClick={handlePreview}
                        disabled={loadingData}
                        className="bg-[#0B2E59] hover:bg-[#113a6b] text-white px-6 py-2 rounded text-sm font-semibold tracking-wide transition-colors flex items-center justify-center min-w-[140px]"
                    >
                        {loadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Scope"}
                    </button>
                </div>
            </div>

            {/* PREVIEW & ACTIONS SECTION */}
            {hasQueried && !loadingData && !reportData && (
                <div className="bg-white border flex items-center justify-center p-12 text-neutral-500 text-sm">
                    No data available for the selected filters.
                </div>
            )}

            {reportData && (
                <div className="bg-white border border-neutral-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-neutral-50/80 border-b border-neutral-200 gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#0B2E59]" />
                            <h2 className="font-bold text-neutral-800 tracking-tight">Report Scope Validated</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleDownloadExcel}
                                className="border border-green-600 text-green-700 bg-green-50 hover:bg-green-100 flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export Excel
                            </button>
                            <PDFDownloadLink
                                document={
                                    <ReportDocument
                                        data={reportData}
                                        startDate={filters.startDate}
                                        endDate={filters.endDate}
                                        generatedBy={username}
                                    />
                                }
                                fileName={`Report_${reportData.tenantName}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`}
                                className="bg-[#0B2E59] hover:bg-[#113a6b] text-white flex items-center gap-2 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors"
                            >
                                {({ loading }) => loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <DownloadCloud className="w-4 h-4" /> Export PDF
                                    </>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>

                    <div className="p-6 overflow-x-auto space-y-8">
                        {/* Executive Summary Mobile-First Grid */}
                        <div>
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 border-b pb-2">1. Executive Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                <div className="p-4 bg-neutral-50 border-l-4 border-[#0B2E59] rounded-r-sm">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Trips</p>
                                    <p className="text-xl font-black text-neutral-900">{reportData.executiveSummary.totalManifests}</p>
                                </div>
                                <div className="p-4 bg-neutral-50 border-l-4 border-neutral-400 rounded-r-sm">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Distance</p>
                                    <p className="text-xl font-bold text-neutral-800">{Number(reportData.executiveSummary.totalDistance).toLocaleString()} <span className="text-sm">KM</span></p>
                                </div>
                                <div className="p-4 bg-neutral-50 border-l-4 border-neutral-400 rounded-r-sm col-span-2 sm:col-span-1">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Fuel Spending</p>
                                    <p className="text-xl font-bold text-neutral-800">{formatCurrency(reportData.executiveSummary.totalFuel)}</p>
                                </div>
                                <div className="p-4 bg-neutral-50 border-l-4 border-neutral-400 rounded-r-sm col-span-2 sm:col-span-1">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Toll Spending</p>
                                    <p className="text-xl font-bold text-neutral-800">{formatCurrency(reportData.executiveSummary.totalTolls)}</p>
                                </div>
                                <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-sm col-span-2 sm:col-span-1 lg:col-span-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-1">Grand Total Cost</p>
                                    <p className="text-xl font-black text-blue-900">{formatCurrency(reportData.executiveSummary.grandTotalCost)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detail Preview Table */}
                        <div>
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 border-b pb-2">2. Data Scope Preview (Partial List)</h3>
                            <div className="w-full overflow-x-auto border border-neutral-200 rounded">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs uppercase bg-[#0B2E59] text-white tracking-wide">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Date</th>
                                            <th className="px-4 py-3 font-semibold">Manifest ID</th>
                                            <th className="px-4 py-3 font-semibold">Route</th>
                                            <th className="px-4 py-3 font-semibold text-right">Estimated</th>
                                            <th className="px-4 py-3 font-semibold text-right">Actual Added</th>
                                            <th className="px-4 py-3 font-semibold text-right">Final Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.transactionTable.slice(0, 10).map((row: any, i: number) => (
                                            <tr key={i} className={`border-b border-neutral-100/50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-neutral-100 transition-colors`}>
                                                <td className="px-4 py-3 text-neutral-600 align-top">{format(new Date(row.date), 'dd/MM/yyyy')}</td>
                                                <td className="px-4 py-3 font-medium text-neutral-900 align-top">{row.manifestId}</td>
                                                <td className="px-4 py-3 text-neutral-600 align-top">{row.routeStr.length > 30 ? row.routeStr.substring(0, 30) + '...' : row.routeStr}</td>
                                                <td className="px-4 py-3 text-neutral-600 text-right align-top">
                                                    <div className="font-semibold text-neutral-800">{formatCurrency(row.estimatedCost)}</div>
                                                    <div className="text-[10px] text-neutral-500 mt-1 space-y-0.5">
                                                        <div className="flex justify-between gap-4"><span>BBM:</span> <span>{formatCurrency(row.estFuel)}</span></div>
                                                        <div className="flex justify-between gap-4"><span>Tol:</span> <span>{formatCurrency(row.estToll)}</span></div>
                                                        <div className="flex justify-between gap-4"><span>Saku:</span> <span>{formatCurrency(row.estAllowance)}</span></div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600 text-right align-top">
                                                    <div className="font-semibold text-neutral-800">{formatCurrency(row.actualAddedExpense)}</div>
                                                    <div className="text-[10px] text-neutral-500 mt-1 space-y-0.5">
                                                        <div className="flex justify-between gap-4"><span>BBM:</span> <span>{formatCurrency(row.actFuel)}</span></div>
                                                        <div className="flex justify-between gap-4"><span>Perbaikan:</span> <span>{formatCurrency(row.actMaintenance)}</span></div>
                                                        <div className="flex justify-between gap-4"><span>Lainnya:</span> <span>{formatCurrency(row.actOthers)}</span></div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-black text-blue-900 text-right align-top text-base">{formatCurrency(row.finalCost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {reportData.transactionTable.length > 10 && (
                                    <div className="p-3 text-center bg-neutral-50 text-xs font-medium text-neutral-500 border-t border-neutral-200">
                                        + {reportData.transactionTable.length - 10} more rows exported in generation.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
