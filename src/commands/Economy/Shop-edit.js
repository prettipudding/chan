import { SlashCommandBuilder } from 'discord.js';
import {
    getShop,
    updateShopItem,
} from '../../utils/shopStorage.js';

export default {
    slashOnly: true,

    data: new SlashCommandBuilder()
        .setName('shop-edit')
        .setDescription('Edit an item in the economy shop.')
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

        const id = interaction.options
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
    },
};
