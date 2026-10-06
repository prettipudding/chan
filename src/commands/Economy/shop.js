import {
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';

import shopBrowse from './modules/shop_browse.js';
import {
    addShopItem,
    updateShopItem,
    removeShopItem,
    getShop,
} from '../../utils/shopStorage.js';
import { BotConfig } from '../../config/bot.js';

export default {
    slashOnly: true,

    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse and manage the economy shop.')

        // /shop add
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add an item to the shop.')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Unique ID for the item, e.g. wolfchan')
                        .setRequired(true)
                        .setMaxLength(32)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the shop item.')
                        .setRequired(true)
                        .setMaxLength(100)
                )
                .addIntegerOption(option =>
                    option
                        .setName('price')
                        .setDescription('Price in cakes.')
                        .setRequired(true)
                        .setMinValue(0)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Description shown in the shop.')
                        .setRequired(true)
                        .setMaxLength(500)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('Custom Discord emoji for the item.')
                        .setRequired(false)
                        .setMaxLength(100)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role given to the buyer.')
                        .setRequired(false)
                )
        )

        // /shop edit
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing shop item.')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('ID of the item to edit.')
                        .setRequired(true)
                        .setMaxLength(32)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('New item name.')
                        .setRequired(false)
                        .setMaxLength(100)
                )
                .addIntegerOption(option =>
                    option
                        .setName('price')
                        .setDescription('New price in cakes.')
                        .setRequired(false)
                        .setMinValue(0)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('New item description.')
                        .setRequired(false)
                        .setMaxLength(500)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('New custom Discord emoji.')
                        .setRequired(false)
                        .setMaxLength(100)
                )
                .addBooleanOption(option =>
                    option
                        .setName('clear_emoji')
                        .setDescription('Remove the current emoji.')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('New role given to buyers.')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('clear_role')
                        .setDescription('Remove the current role reward.')
                        .setRequired(false)
                )
        )

        // /shop remove
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove an item from the shop.')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('ID of the item to remove.')
                        .setRequired(true)
                        .setMaxLength(32)
                )
        ),

    async execute(interaction, config, client) {
        const subcommand = interaction.options.getSubcommand(false);

        // /shop by itself is public.
        if (!subcommand) {
            return shopBrowse.execute(
                interaction,
                config,
                client
            );
        }

        // Only Manage Server members can modify the shop.
        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return interaction.reply({
                content:
                    '♡ You need **Manage Server** permission to manage the shop.',
                ephemeral: true,
            });
        }

        const guildId = interaction.guildId;

        if (!guildId) {
            return interaction.reply({
                content:
                    '♡ Shop management can only be used inside a server.',
                ephemeral: true,
            });
        }

        // ─────────────────────────────
        // /shop add
        // ─────────────────────────────

        if (subcommand === 'add') {
            const rawId =
                interaction.options.getString('id');

            const id = rawId
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-');

            const name =
                interaction.options.getString('name').trim();

            const price =
                interaction.options.getInteger('price');

            const description =
                interaction.options
                    .getString('description')
                    .trim();

            const emoji =
                interaction.options.getString('emoji');

            const role =
                interaction.options.getRole('role');

            // Keep IDs simple and command-friendly.
            if (!/^[a-z0-9_-]+$/.test(id)) {
                return interaction.reply({
                    content:
                        '♡ The item ID can only contain lowercase letters, numbers, `_`, and `-`.',
                    ephemeral: true,
                });
            }

            const shop = await getShop(
                client,
                guildId
            );

            if (
                shop.some(item => item.id === id)
            ) {
                return interaction.reply({
                    content:
                        `♡ An item with the ID \`${id}\` already exists.`,
                    ephemeral: true,
                });
            }

            if (role?.isEveryone()) {
                return interaction.reply({
                    content:
                        '♡ You cannot use the @everyone role as a shop reward.',
                    ephemeral: true,
                });
            }

            const item = {
                id,
                name,
                price,
                description,
                emoji: emoji || null,
                roleId: role?.id || null,
                type: role ? 'role' : 'collectible',
            };

            const saved = await addShopItem(
                client,
                guildId,
                item
            );

            if (!saved) {
                return interaction.reply({
                    content:
                        '♡ I could not save that shop item. Please try again.',
                    ephemeral: true,
                });
            }

            const currencySymbol =
                BotConfig.economy.currency.symbol;

            const currencyName =
                BotConfig.economy.currency.namePlural;

            return interaction.reply({
                content:
                    `♡ Added **${name}** to the shop!\n\n` +
                    `**ID:** \`${id}\`\n` +
                    `**Price:** ${currencySymbol}${price.toLocaleString()} ${currencyName}\n` +
                    `**Description:** ${description}\n` +
                    `**Emoji:** ${emoji || 'None'}\n` +
                    `**Role:** ${role ? role.toString() : 'None'}`,
                ephemeral: true,
            });
        }

        // ─────────────────────────────
        // /shop edit
        // ─────────────────────────────

        if (subcommand === 'edit') {
            const id =
                interaction.options
                    .getString('id')
                    .trim()
                    .toLowerCase();

            const shop = await getShop(
                client,
                guildId
            );

            const item = shop.find(
                entry => entry.id === id
            );

            if (!item) {
                return interaction.reply({
                    content:
                        `♡ I couldn't find a shop item with the ID \`${id}\`.`,
                    ephemeral: true,
                });
            }

            const name =
                interaction.options.getString('name');

            const price =
                interaction.options.getInteger('price');

            const description =
                interaction.options.getString(
                    'description'
                );

            const emoji =
                interaction.options.getString('emoji');

            const clearEmoji =
                interaction.options.getBoolean(
                    'clear_emoji'
                );

            const role =
                interaction.options.getRole('role');

            const clearRole =
                interaction.options.getBoolean(
                    'clear_role'
                );

            if (emoji && clearEmoji) {
                return interaction.reply({
                    content:
                        '♡ Choose either a new emoji or `clear_emoji`, not both.',
                    ephemeral: true,
                });
            }

            if (role && clearRole) {
                return interaction.reply({
                    content:
                        '♡ Choose either a new role or `clear_role`, not both.',
                    ephemeral: true,
                });
            }

            if (role?.isEveryone()) {
                return interaction.reply({
                    content:
                        '♡ You cannot use the @everyone role as a shop reward.',
                    ephemeral: true,
                });
            }

            const updates = {};

            if (name !== null) {
                updates.name = name.trim();
            }

            if (price !== null) {
                updates.price = price;
            }

            if (description !== null) {
                updates.description =
                    description.trim();
            }

            if (clearEmoji) {
                updates.emoji = null;
            } else if (emoji !== null) {
                updates.emoji = emoji;
            }

            if (clearRole) {
                updates.roleId = null;
                updates.type = 'collectible';
            } else if (role) {
                updates.roleId = role.id;
                updates.type = 'role';
            }

            if (Object.keys(updates).length === 0) {
                return interaction.reply({
                    content:
                        '♡ You did not provide anything to change.',
                    ephemeral: true,
                });
            }

            const updated =
                await updateShopItem(
                    client,
                    guildId,
                    id,
                    updates
                );

            if (!updated) {
                return interaction.reply({
                    content:
                        '♡ I could not save those changes. Please try again.',
                    ephemeral: true,
                });
            }

            return interaction.reply({
                content:
                    `♡ Updated **${updates.name || item.name}**.\n\n` +
                    `Use \`/shop\` to see the changes.`,
                ephemeral: true,
            });
        }

        // ─────────────────────────────
        // /shop remove
        // ─────────────────────────────

        if (subcommand === 'remove') {
            const id =
                interaction.options
                    .getString('id')
                    .trim()
                    .toLowerCase();

            const shop = await getShop(
                client,
                guildId
            );

            const item = shop.find(
                entry => entry.id === id
            );

            if (!item) {
                return interaction.reply({
                    content:
                        `♡ I couldn't find a shop item with the ID \`${id}\`.`,
                    ephemeral: true,
                });
            }

            const removed =
                await removeShopItem(
                    client,
                    guildId,
                    id
                );

            if (!removed) {
                return interaction.reply({
                    content:
                        '♡ I could not remove that item. Please try again.',
                    ephemeral: true,
                });
            }

            return interaction.reply({
                content:
                    `♡ Removed **${item.name}** from the shop.`,
                ephemeral: true,
            });
        }
    },
};
