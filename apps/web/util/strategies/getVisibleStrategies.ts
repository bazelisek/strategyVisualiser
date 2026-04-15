'use server';

import { getServerSession } from "@/auth/server";
import { fetchDataFromUrl } from "@/util/fetch";
import { Strategy } from "@/util/strategies/strategies";
import { getBaseUrl } from "../baseURL";

const BASE_URL = getBaseUrl();

type Strategies = {
    publicStrategies: Strategy[],
    privateStrategies: Strategy[]
}

export default async function getVisibleStrategies(): Promise<Strategies> {
    const session = await getServerSession();
    const isAuthenticated = Boolean(session?.user);
    const userEmail = session?.user.email;

    if (!isAuthenticated || !userEmail) {
        return { publicStrategies: [], privateStrategies: [] };
    }

    const { data, error } = await fetchDataFromUrl(BASE_URL + '/api/strategies/users/' + encodeURIComponent(userEmail));
    if (error) {
        return { publicStrategies: [], privateStrategies: [] };
    }
    
    return data;
}