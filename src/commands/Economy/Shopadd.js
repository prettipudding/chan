import { SlashCommandBuilder } from 'discord.js';
import {
    addShopItem,
    getShop,
} from '../../utils/shopStorage.js';
import { BotConfig } from '../../config/bot.js';

export default {
    slashOnly: true,

    data: new SlashCommandBuilder()
        .setName('shop-add')
        .setDescription('Add an item to the economy shop.')
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('Unique ID for the item.')
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
        ),

    async execute(interaction, config, client) {
        if (
            !interaction.memberPermissions?.has(
                'ManageGuild'
            )
        ) {
            return interaction.reply({
                content:
                    '♡ You need **Manage Server** permission to manage the shop.',
                ephemeral: true,
            });
        }

        const guildId = interaction.guildId;

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
    },
};
