export const shopItems = [
    {
        id: 'studio_headphones',
        name: 'Studio Headphones',
        price: 1200,
        emoji: '<:Headphones:1557044580455547051>',
        description: 'A pair of studio headphones for late-night listening.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'wolf_chan_plush',
        name: 'Wolf Chan Plush',
        price: 5000,
        emoji: '<:wolfchan:1557042418405351454>',
        description: 'A fluffy Wolf Chan plushie ♡',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'changbin_tomagotchi',
        name: 'Changbin Tomagotchi',
        price: null,
        emoji: '<:Changbinstomagotchi:1557047297538392124>',
        description: 'A tiny Changbin companion to keep forever.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'hyunjin_keychain',
        name: "Hyunjin's Keychain",
        price: null,
        emoji: '<:versacekeychain:1557044582448111646>',
        description: "A cute Hyunjin keychain collectible.",
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'felix_brownies',
        name: 'Brownies — made by Felix xx',
        price: null,
        emoji: '<:Brownies:1557044583735496915>',
        description: 'Fresh brownies made by Felix ♡',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'leebit',
        name: 'Leebit',
        price: null,
        emoji: '<:leebit:1557044579235274863>',
        description: 'A tiny Leebit collectible.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'ot8_signed_album',
        name: 'OT8 Signed Album',
        price: null,
        emoji: null,
        description: 'A signed album featuring all eight members.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'han_pocky',
        name: "Han's Pocky — cute collectible",
        price: null,
        emoji: '<:Pocky:1557044584666759259>',
        description: "Han's cute Pocky collectible.",
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'seungmin_polaroid',
        name: "Seungmin's Polaroid",
        price: null,
        emoji: '<:Seungminpolaroid:1557044581101469737>',
        description: "A Seungmin polaroid collectible.",
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'in_pc',
        name: 'I.N PC',
        price: null,
        emoji: '<:innie_pc:1557042937160798288>',
        description: 'An I.N photocard collectible.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'this_and_that',
        name: 'This & That',
        price: null,
        emoji: null,
        description: 'This & That album.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'karma',
        name: 'KARMA',
        price: null,
        emoji: null,
        description: 'KARMA album.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'do_it',
        name: 'DO IT',
        price: null,
        emoji: null,
        description: 'DO IT album.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'maxident',
        name: 'MAXIDENT',
        price: null,
        emoji: null,
        description: 'MAXIDENT album.',
        type: 'collectible',
        roleId: null,
    },

    {
        id: 'go_saeng',
        name: 'GO生',
        price: null,
        emoji: null,
        description: 'GO生 album.',
        type: 'collectible',
        roleId: null,
    },
];

export function getItemById(itemId) {
    return shopItems.find(item => item.id === itemId);
}

export function getItemsByType(type) {
    return shopItems.filter(item => item.type === type);
}

export function getItemPrice(itemId) {
    const item = getItemById(itemId);
    return item?.price ?? 0;
}

export function validatePurchase(itemId, userData) {
    const item = getItemById(itemId);

    if (!item) {
        return {
            valid: false,
            reason: 'Item not found',
        };
    }

    if (item.price === null) {
        return {
            valid: false,
            reason: 'This item is not currently available for purchase.',
        };
    }

    return { valid: true };
}
