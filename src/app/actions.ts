
'use server';

import { loadSampleData, processChatlog } from "@/lib/data";

export async function processChatlogFile() {
    return await processChatlog();
}

export async function loadDefaultXlsxFile() {
    return await loadSampleData();
}
