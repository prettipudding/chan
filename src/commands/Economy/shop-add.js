import {
    SlashCommandBuilder,
    PermissionFlagsBits,
} from 'discord.js';

import {
    addShopItem,
    getShop,
} from '../../utils/shopStorage.js';

import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('shop-add')
        .setDescription('Add an item to the shop.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild.toString()
        )

        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('Unique ID for the item, e.g. wolf_chan_plush')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('The name shown in the shop.')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('price')
                .setDescription('Price in cakes.')
                .setMinValue(0)
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('description')
                .setDescription('Description shown underneath the item.')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('emoji')
                .setDescription('Custom Discord emoji for the item.')
                .setRequired(false)
        )

        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Role given to the buyer.')
                .setRequired(false)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred =
            await InteractionHelper.safeDefer(interaction);

        if (!deferred) return;

        const guildId = interaction.guildId;

        const id = interaction.options
            .getString('id')
            .toLowerCase()
            .trim();

        const name =
            interaction.options.getString('name').trim();

        const price =
            interaction.options.getInteger('price');

        const description =
            interaction.options
                .getString('description')
                .trim();

        const emoji =
            interaction.options.getString('emoji') || null;

        const role =
            interaction.options.getRole('role');

        const shop =
            await getShop(client, guildId);

        if (shop.some(item => item.id === id)) {
            throw createError(
                'Item already exists',
                ErrorTypes.VALIDATION,
                `An item with the ID \`${id}\` already exists in this shop.`,
                { id }
            );
        }

        const item = {
            id,
            name,
            price,
            emoji,
            description,
            type: 'collectible',
            roleId: role?.id || null,
        };

        const saved =
            await addShopItem(
                client,
                guildId,
                item
            );

        if (!saved) {
            throw createError(
                'Shop save failed',
                ErrorTypes.DATABASE,
                'I could not save the new shop item.',
                { id }
            );
        }

        let message =
            `**${name}** has been added to the shop!\n\n` +
            `**ID:** \`${id}\`\n` +
            `**Price:** ${price.toLocaleString()} cakes\n` +
            `**Description:** ${description}`;

        if (emoji) {
            message += `\n**Icon:** ${emoji}`;
        }

        if (role) {
            message += `\n**Role:** ${role}`;
        }

        await InteractionHelper.safeEditReply(
            interaction,
            {
                content: `♡ ${message}`,
            }
        );
    }, { command: 'shop-add' }),
};
