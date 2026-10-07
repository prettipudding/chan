import { SlashCommandBuilder } from 'discord.js';
import {
    getShop,
    removeShopItem,
} from '../../utils/shopStorage.js';

export default {
    slashOnly: true,

    data: new SlashCommandBuilder()
        .setName('shop-remove')
        .setDescription('Remove an item from the economy shop.')
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('ID of the item to remove.')
                .setRequired(true)
                .setMaxLength(32)
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
    },
};
