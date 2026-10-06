import { logger } from './logger.js';

function getShopKey(guildId) {
    return `guild:${guildId}:shop`;
}

function normalizeShop(shop) {
    return Array.isArray(shop) ? shop : [];
}

export async function getShop(client, guildId) {
    try {
        if (!client?.db || typeof client.db.get !== 'function') {
            logger.error('Database is unavailable for shop storage.');
            return [];
        }

        const shop = await client.db.get(
            getShopKey(guildId),
            []
        );

        return normalizeShop(shop);
    } catch (error) {
        logger.error(
            `Error loading shop for guild ${guildId}:`,
            error
        );

        return [];
    }
}

export async function saveShop(client, guildId, shop) {
    try {
        if (!client?.db || typeof client.db.set !== 'function') {
            logger.error('Database is unavailable for shop storage.');
            return false;
        }

        await client.db.set(
            getShopKey(guildId),
            normalizeShop(shop)
        );

        return true;
    } catch (error) {
        logger.error(
            `Error saving shop for guild ${guildId}:`,
            error
        );

        return false;
    }
}

export async function addShopItem(client, guildId, item) {
    const shop = await getShop(client, guildId);

    shop.push(item);

    return saveShop(client, guildId, shop);
}

export async function updateShopItem(
    client,
    guildId,
    itemId,
    updates
) {
    const shop = await getShop(client, guildId);

    const index = shop.findIndex(
        item => item.id === itemId
    );

    if (index === -1) {
        return false;
    }

    shop[index] = {
        ...shop[index],
        ...updates,
    };

    return saveShop(client, guildId, shop);
}

export async function removeShopItem(
    client,
    guildId,
    itemId
) {
    const shop = await getShop(client, guildId);

    const filteredShop = shop.filter(
        item => item.id !== itemId
    );

    if (filteredShop.length === shop.length) {
        return false;
    }

    return saveShop(
        client,
        guildId,
        filteredShop
    );
}
