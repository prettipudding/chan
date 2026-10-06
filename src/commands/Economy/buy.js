import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { shopItems } from '../../config/shop/items.js';
import { BotConfig } from '../../config/bot.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const SHOP_ITEMS = shopItems;

export default {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the shop')
        .addStringOption(option =>
            option
                .setName('item_id')
                .setDescription('ID of the item to buy')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('quantity')
                .setDescription('Quantity to buy (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const itemId = interaction.options
            .getString('item_id')
            .toLowerCase();

        const quantity =
            interaction.options.getInteger('quantity') || 1;

        const item = SHOP_ITEMS.find(i => i.id === itemId);

        if (!item) {
            throw createError(
                `Item ${itemId} not found`,
                ErrorTypes.VALIDATION,
                `The item ID \`${itemId}\` does not exist in the shop.`,
                { itemId }
            );
        }

        // Items with no price cannot be purchased yet.
        if (item.price === null || item.price === undefined) {
            throw createError(
                'Item unavailable',
                ErrorTypes.VALIDATION,
                `**${item.name}** is not currently available for purchase.`,
                { itemId }
            );
        }

        if (quantity < 1) {
            throw createError(
                'Invalid quantity',
                ErrorTypes.VALIDATION,
                'You must purchase a quantity of 1 or more.',
                { quantity }
            );
        }

        const currencySymbol =
            BotConfig.economy.currency.symbol;

        const currencyName =
            BotConfig.economy.currency.namePlural;

        const totalCost = item.price * quantity;

        const userData =
            await getEconomyData(client, guildId, userId);

        if (userData.wallet < totalCost) {
            throw createError(
                'Insufficient funds',
                ErrorTypes.VALIDATION,
                `You need **${currencySymbol}${totalCost.toLocaleString()} ${currencyName}** to purchase ${quantity}x **${item.name}**, but you only have **${currencySymbol}${userData.wallet.toLocaleString()} ${currencyName}** in cash.`,
                {
                    required: totalCost,
                    current: userData.wallet,
                    itemId,
                    quantity,
                }
            );
        }

        // Make sure inventory exists.
        if (!userData.inventory) {
            userData.inventory = {};
        }

        // Items with roles can only be purchased once.
        if (item.roleId) {
            if (quantity > 1) {
                throw createError(
                    'Invalid quantity',
                    ErrorTypes.VALIDATION,
                    `You can only purchase **${item.name}** once.`,
                    { itemId, quantity }
                );
            }

            if (interaction.member.roles.cache.has(item.roleId)) {
                throw createError(
                    'Role already owned',
                    ErrorTypes.VALIDATION,
                    `You already have the role for **${item.name}**.`,
                    { itemId, roleId: item.roleId }
                );
            }

            const role =
                interaction.guild.roles.cache.get(item.roleId);

            if (!role) {
                throw createError(
                    'Role not found',
                    ErrorTypes.CONFIGURATION,
                    `The role attached to **${item.name}** could not be found in this server.`,
                    { itemId, roleId: item.roleId }
                );
            }

            if (
                role.position >=
                interaction.guild.members.me.roles.highest.position
            ) {
                throw createError(
                    'Role cannot be assigned',
                    ErrorTypes.DISCORD_API,
                    `I can't give you the **${role.name}** role because my highest role needs to be above it in the server role list.`,
                    { itemId, roleId: item.roleId }
                );
            }
        }

        // Deduct the cakes.
        userData.wallet -= totalCost;

        // Add the item to inventory.
        userData.inventory[itemId] =
            (userData.inventory[itemId] || 0) + quantity;

        let successDescription =
            `You successfully purchased ${quantity}x **${item.name}** for **${currencySymbol}${totalCost.toLocaleString()} ${currencyName}**!`;

        // Give the item's custom role, if one is configured.
        if (item.roleId) {
            const role =
                interaction.guild.roles.cache.get(item.roleId);

            try {
                await interaction.member.roles.add(
                    role,
                    `Purchased shop item: ${item.name}`
                );

                successDescription +=
                    `\n\n**♡ ${role.toString()} has been added to your roles!**`;
            } catch (roleError) {
                // Refund everything if the role could not be given.
                userData.wallet += totalCost;
                userData.inventory[itemId] -= quantity;

                if (userData.inventory[itemId] <= 0) {
                    delete userData.inventory[itemId];
                }

                await setEconomyData(
                    client,
                    guildId,
                    userId,
                    userData
                );

                throw createError(
                    'Role assignment failed',
                    ErrorTypes.DISCORD_API,
                    `I couldn't give you the role for **${item.name}**, so your ${currencyName} have been refunded.`,
                    {
                        roleId: item.roleId,
                        originalError: roleError.message,
                    }
                );
            }
        }

        await setEconomyData(
            client,
            guildId,
            userId,
            userData
        );

        const embed = successEmbed(
            '♡ Purchase Successful',
            successDescription
        ).addFields({
            name: 'New Balance',
            value: `${currencySymbol}${userData.wallet.toLocaleString()} ${currencyName}`,
            inline: true,
        });

        await InteractionHelper.safeEditReply(
            interaction,
            {
                embeds: [embed],
                flags: [MessageFlags.Ephemeral],
            }
        );
    }, { command: 'buy' })
};
