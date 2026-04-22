'use server';

import { getUserByEmail } from "@/auth/server";
import { getServerSession } from "@/auth/server";
import { fetchDataFromUrl } from "@/util/fetch";
import { Strategy } from "@/util/strategies/strategies";
import { User } from "better-auth";
import { getBaseUrl } from "../baseURL";

const BASE_URL = getBaseUrl();

type Strategies = {
    publicStrategies: Strategy[],
    privateStrategies: Strategy[]
}

type StrategyApiResponse = Omit<Strategy, "ownerUser"> & {
    ownerEmail?: string | null;
};

async function normalizeStrategy(strategy: StrategyApiResponse): Promise<Strategy> {
    const ownerEmail = strategy.ownerEmail ?? null;
    const ownerUser =
        (ownerEmail ? await getUserByEmail(ownerEmail) : null) ??
        ({
            id: `builtin-${strategy.id}`,
            name: ownerEmail?.split("@")[0] ?? "System",
            email: ownerEmail ?? "system@strategy.local",
            emailVerified: false,
            image: null,
            createdAt: new Date(strategy.createdAt),
            updatedAt: new Date(strategy.updatedAt),
        } satisfies User);

    return {
        ...strategy,
        ownerUser,
    };
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

    const privateStrategies = await Promise.all(
        ((data?.privateStrategies as StrategyApiResponse[] | undefined) ?? []).map(normalizeStrategy)
    );
    const publicStrategies = await Promise.all(
        ((data?.publicStrategies as StrategyApiResponse[] | undefined) ?? []).map(normalizeStrategy)
    );

    return { publicStrategies, privateStrategies };
}
