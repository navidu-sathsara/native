/**
 * NATIVE LAUNCH - DISCORD COMMUNITY & AUTOMATION BOT
 * Clean, Minimal Server Auto-Setup, 1-Click Verification, Ticket System, and Payment Webhook Relays.
 */

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
        if (typeof process.loadEnvFile === 'function') {
            try { process.loadEnvFile(envPath); } catch (_) {}
        }
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const idx = trimmed.indexOf('=');
                if (idx > 0) {
                    const key = trimmed.slice(0, idx).trim();
                    const val = trimmed.slice(idx + 1).trim();
                    if (!process.env[key]) process.env[key] = val;
                }
            }
        } catch (_) {}
    }
}
loadEnv();

class NativeDiscordBot {
    constructor(options = {}) {
        loadEnv();
        this.token = options.token || process.env.DISCORD_BOT_TOKEN || '';
        this.guildId = options.guildId || process.env.DISCORD_GUILD_ID || '';
        this.ownerId = options.ownerId || process.env.DISCORD_OWNER_ID || '';

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
        });

        this.isReady = false;
        this._bindEvents();
    }

    _bindEvents() {
        this.client.on('ready', async () => {
            this.isReady = true;
            console.log(`[DiscordBot] ⚡ Logged in as ${this.client.user.tag} (${this.client.user.id})`);
            
            // Clean presence - No emoji, just nativelaunch.xyz
            this.client.user.setActivity('nativelaunch.xyz', { type: 3 }); // 3 = WATCHING

            // Register Slash Commands
            await this._registerSlashCommands();
        });

        this.client.on('guildCreate', async (guild) => {
            console.log(`[DiscordBot] 🏰 Joined new server: ${guild.name} (${guild.id})`);
            await this._registerSlashCommands();
        });

        this.client.on('messageCreate', async (message) => {
            try {
                if (message.author.bot) return;
                if (!message.content.startsWith('!')) return;

                const args = message.content.slice(1).trim().split(/ +/);
                const command = args.shift().toLowerCase();

                await this._handleCommand(message, command, args);
            } catch (err) {
                console.error('[DiscordBot] Error handling message command:', err);
            }
        });

        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isChatInputCommand()) {
                    await this._handleSlashCommand(interaction);
                } else if (interaction.isButton()) {
                    await this._handleButtonInteraction(interaction);
                }
            } catch (err) {
                console.error('[DiscordBot] Error handling interaction:', err);
                if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ An error occurred processing this interaction.', ephemeral: true }).catch(() => {});
                }
            }
        });
    }

    async _registerSlashCommands() {
        if (!this.client.user) return;
        try {
            const commands = [
                new SlashCommandBuilder()
                    .setName('setup')
                    .setDescription('Wipes & auto-creates clean server roles, verify category, channels & permissions'),
                new SlashCommandBuilder()
                    .setName('verify-panel')
                    .setDescription('Posts the 1-click verification panel in this channel (Admin only)'),
                new SlashCommandBuilder()
                    .setName('ticket-panel')
                    .setDescription('Posts the interactive customer support panel (Admin only)'),
                new SlashCommandBuilder()
                    .setName('status')
                    .setDescription('Displays live bot & server telemetry'),
                new SlashCommandBuilder()
                    .setName('ping')
                    .setDescription('Checks bot response latency'),
                new SlashCommandBuilder()
                    .setName('help')
                    .setDescription('Displays bot commands and guides')
            ].map(c => c.toJSON());

            const rest = new REST({ version: '10' }).setToken(this.token);

            if (this.guildId) {
                await rest.put(
                    Routes.applicationGuildCommands(this.client.user.id, this.guildId),
                    { body: commands }
                );
                console.log(`[DiscordBot] ✅ Registered ${commands.length} slash commands for Guild: ${this.guildId}`);
            } else {
                await rest.put(
                    Routes.applicationCommands(this.client.user.id),
                    { body: commands }
                );
                console.log(`[DiscordBot] ✅ Registered ${commands.length} global slash commands`);
            }
        } catch (err) {
            console.error('[DiscordBot] Failed to register slash commands:', err.message);
        }
    }

    async _handleSlashCommand(interaction) {
        const { commandName, guild, member, user, channel } = interaction;
        const isOwner = user.id === this.ownerId || user.id === guild?.ownerId;
        const isAdmin = isOwner || member?.permissions.has(PermissionsBitField.Flags.Administrator);

        if (commandName === 'setup') {
            if (!isAdmin) {
                return interaction.reply({ content: '❌ Only administrators can execute `/setup`.', ephemeral: true });
            }
            await interaction.reply({ content: '🧹 **Cleaning and auto-building server structure...**', ephemeral: false });
            await this.setupCleanServer(guild, channel);
        } else if (commandName === 'help') {
            const embed = new EmbedBuilder()
                .setTitle('Native Community Bot')
                .setColor(0x10B981)
                .setDescription('Clean & Minimal Discord Automation for Native Launch.')
                .addFields(
                    { name: '`/setup` or `!setup`', value: 'Wipes and builds clean roles, verify category & channels (Admin only).' },
                    { name: '`/verify-panel`', value: 'Posts the 1-click verification panel (Admin only).' },
                    { name: '`/ticket-panel`', value: 'Posts the interactive customer support panel (Admin only).' },
                    { name: '`/status`', value: 'Displays platform & fleet telemetry.' },
                    { name: '`/ping`', value: 'Checks bot response latency.' }
                )
                .setFooter({ text: 'Native Launch SaaS' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else if (commandName === 'ping') {
            const latency = Date.now() - interaction.createdTimestamp;
            await interaction.reply(`🏓 Pong! Latency: \`${latency}ms\` · API: \`${Math.round(this.client.ws.ping)}ms\``);
        } else if (commandName === 'status') {
            const embed = new EmbedBuilder()
                .setTitle('Platform Status · Native Launch')
                .setColor(0x3B82F6)
                .addFields(
                    { name: 'Discord Gateway', value: '🟢 Online · WebSocket Active', inline: true },
                    { name: 'Web Control Plane', value: '🟢 https://nativelaunch.xyz', inline: true },
                    { name: 'Server Guild', value: guild ? guild.name : 'Unknown', inline: true }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } else if (commandName === 'verify-panel') {
            if (!isAdmin) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
            await this.postVerificationPanel(channel);
            await interaction.reply({ content: '✅ Verification panel posted.', ephemeral: true });
        } else if (commandName === 'ticket-panel') {
            if (!isAdmin) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
            await this.postTicketPanel(channel);
            await interaction.reply({ content: '✅ Ticket panel posted.', ephemeral: true });
        }
    }

    async _handleCommand(message, command, args) {
        const isOwner = message.author.id === this.ownerId || message.author.id === message.guild?.ownerId;
        const isAdmin = isOwner || message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

        if (command === 'setup' || command === 'setup-server') {
            if (!isAdmin) {
                return message.reply('❌ Only administrators or the bot owner can execute `!setup`.');
            }
            await this.setupCleanServer(message.guild, message.channel);
        } else if (command === 'help') {
            const embed = new EmbedBuilder()
                .setTitle('Native Community Bot')
                .setColor(0x10B981)
                .setDescription('Clean & Minimal Discord Automation for Native Launch.')
                .addFields(
                    { name: '`!setup`', value: 'Wipes and builds clean roles, verify category & channels (Admin only).' },
                    { name: '`!verify-panel`', value: 'Posts the 1-click verification panel (Admin only).' },
                    { name: '`!ticket-panel`', value: 'Posts the interactive customer support panel (Admin only).' },
                    { name: '`!status`', value: 'Displays platform & fleet telemetry.' },
                    { name: '`!ping`', value: 'Checks bot response latency.' }
                )
                .setFooter({ text: 'Native Launch SaaS' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else if (command === 'ping') {
            const latency = Date.now() - message.createdTimestamp;
            await message.reply(`🏓 Pong! Latency: \`${latency}ms\` · API: \`${Math.round(this.client.ws.ping)}ms\``);
        } else if (command === 'status') {
            const embed = new EmbedBuilder()
                .setTitle('Platform Status · Native Launch')
                .setColor(0x3B82F6)
                .addFields(
                    { name: 'Discord Gateway', value: '🟢 Online · WebSocket Active', inline: true },
                    { name: 'Web Control Plane', value: '🟢 https://nativelaunch.xyz', inline: true },
                    { name: 'Server Guild', value: message.guild.name, inline: true }
                )
                .setTimestamp();
            await message.reply({ embeds: [embed] });
        } else if (command === 'verify-panel') {
            if (!isAdmin) return message.reply('❌ Admin only.');
            await this.postVerificationPanel(message.channel);
            await message.delete().catch(() => {});
        } else if (command === 'ticket-panel') {
            if (!isAdmin) return message.reply('❌ Admin only.');
            await this.postTicketPanel(message.channel);
            await message.delete().catch(() => {});
        }
    }

    async _handleButtonInteraction(interaction) {
        const { customId, guild, member, user } = interaction;

        // 1. Verification Button
        if (customId === 'verify_btn') {
            const memberRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'member');
            if (!memberRole) {
                return interaction.reply({ content: '❌ `Member` role not found. Please contact an Administrator.', ephemeral: true });
            }

            if (member.roles.cache.has(memberRole.id)) {
                return interaction.reply({ content: '✅ You are already verified as a Member.', ephemeral: true });
            }

            await member.roles.add(memberRole);
            return interaction.reply({
                content: '✅ **Verification Complete!** Welcome to Native Launch. Community channels are now unlocked.',
                ephemeral: true
            });
        }

        // 2. Open Ticket Button
        if (customId === 'open_ticket_btn') {
            await interaction.deferReply({ ephemeral: true });

            const safeUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || user.id.slice(-4);
            const channelName = `ticket-${safeUsername}`;

            // Check if ticket already exists
            const existingChannel = guild.channels.cache.find(c => c.name === channelName && c.type === ChannelType.GuildText);
            if (existingChannel) {
                return interaction.editReply({
                    content: `⚠️ You already have an open ticket in <#${existingChannel.id}>.`
                });
            }

            // Find SUPPORT category
            const supportCategory = guild.channels.cache.find(c => c.name.toUpperCase() === 'SUPPORT' && c.type === ChannelType.GuildCategory);
            const founderRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'founder');
            const devRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'developer');
            const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'admin');
            const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'moderator');

            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ];

            const staffRoles = [founderRole, devRole, adminRole, modRole].filter(Boolean);
            for (const r of staffRoles) {
                permissionOverwrites.push({
                    id: r.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                });
            }

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: supportCategory ? supportCategory.id : null,
                permissionOverwrites,
                topic: `Support ticket for @${user.tag} (${user.id})`
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`Support Ticket · ${user.username}`)
                .setColor(0x10B981)
                .setDescription(
                    `Hello <@${user.id}>, welcome to Native Support.\n\n` +
                    `Please explain your issue or question below:\n` +
                    `• **Billing & PayPal Inquiries**\n` +
                    `• **Bot Setup & Proxy Configuration**\n` +
                    `• **Bug Reports & Platform Assistance**\n\n` +
                    `Our team will assist you shortly.`
                )
                .setTimestamp();

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket_btn')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await ticketChannel.send({
                content: `<@${user.id}> | ${adminRole ? `<@&${adminRole.id}>` : '@Staff'}`,
                embeds: [ticketEmbed],
                components: [closeRow]
            });

            return interaction.editReply({
                content: `✅ Ticket created successfully in <#${ticketChannel.id}>.`
            });
        }

        // 3. Close Ticket Button
        if (customId === 'close_ticket_btn') {
            const isTicketChannel = interaction.channel.name.startsWith('ticket-');
            if (!isTicketChannel) {
                return interaction.reply({ content: '❌ This button can only be used inside ticket channels.', ephemeral: true });
            }

            await interaction.reply({
                content: '🔒 **Ticket resolved.** Closing and deleting this channel in 5 seconds...'
            });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete('Ticket closed by user or staff');
                } catch (e) {
                    console.error('[DiscordBot] Failed to delete ticket channel:', e.message);
                }
            }, 5000);
        }
    }

    /**
     * ⚡ 1-CLICK CLEAN SERVER AUTO-SETUP
     * Wipes existing channels, builds clean roles, separate verify category, channels, permissions & embeds.
     */
    async setupCleanServer(guild, progressChannel = null) {
        const log = (msg) => {
            console.log(`[DiscordBot Setup] ${msg}`);
            if (progressChannel && progressChannel.id) {
                progressChannel.send(`⏳ ${msg}`).catch(() => {});
            }
        };

        log('Wiping existing server channels and building clean structure...');

        // 0. Delete existing channels (except progress channel if present)
        const oldChannels = guild.channels.cache.filter(c => !progressChannel || c.id !== progressChannel.id);
        for (const [, ch] of oldChannels) {
            try {
                await ch.delete('Native Clean Server Setup Wipe');
            } catch (e) {
                // Ignore if already deleted
            }
        }

        // 1. Roles Definition (Founder, Developer, Admin, Moderator, VIP Customer, Member)
        const roleDefs = [
            { name: 'Founder', color: 0xF59E0B, permissions: [PermissionsBitField.Flags.Administrator], hoist: true },
            { name: 'Developer', color: 0x6366F1, permissions: [PermissionsBitField.Flags.Administrator], hoist: true },
            { name: 'Admin', color: 0xEF4444, permissions: [PermissionsBitField.Flags.Administrator], hoist: true },
            { name: 'Moderator', color: 0x3B82F6, permissions: [
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.KickMembers,
                PermissionsBitField.Flags.ModerateMembers,
                PermissionsBitField.Flags.ViewAuditLog
            ], hoist: true },
            { name: 'VIP Customer', color: 0xA855F7, permissions: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
            ], hoist: true },
            { name: 'Member', color: 0x10B981, permissions: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
            ], hoist: false },
        ];

        const createdRoles = {};
        for (const def of roleDefs) {
            let role = guild.roles.cache.find(r => r.name.toLowerCase() === def.name.toLowerCase());
            if (!role) {
                try {
                    role = await guild.roles.create({
                        name: def.name,
                        color: def.color,
                        permissions: def.permissions,
                        hoist: def.hoist,
                        reason: 'Native Launch Auto Server Setup'
                    });
                    log(`Created role: ${def.name}`);
                } catch (e) {
                    console.error(`[DiscordBot] Error creating role ${def.name}:`, e.message);
                }
            }
            if (role) createdRoles[def.name] = role;
        }

        // Give Founder role to server owner or ownerId
        try {
            const ownerMember = await guild.members.fetch(this.ownerId || guild.ownerId).catch(() => null);
            if (ownerMember && createdRoles['Founder']) {
                await ownerMember.roles.add(createdRoles['Founder']).catch(() => {});
            }
        } catch (_) {}

        const everyoneRole = guild.roles.everyone;
        const memberRole = createdRoles['Member'] || everyoneRole;
        const vipRole = createdRoles['VIP Customer'] || everyoneRole;
        const founderRole = createdRoles['Founder'];
        const devRole = createdRoles['Developer'];
        const adminRole = createdRoles['Admin'];
        const modRole = createdRoles['Moderator'];

        const staffAllows = [founderRole, devRole, adminRole, modRole].filter(Boolean).map(r => ({
            id: r.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
        }));

        // 2. Categories & Channels Definition (VERIFICATION IS ITS OWN DEDICATED CATEGORY AT TOP)
        const categoriesDef = [
            {
                name: 'VERIFY',
                permissions: [
                    { id: everyoneRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] }
                ],
                channels: [
                    { name: 'verify', type: ChannelType.GuildText, topic: 'Click the verify button to unlock the community' }
                ]
            },
            {
                name: 'INFORMATION',
                permissions: [
                    { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: memberRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
                    ...staffAllows
                ],
                channels: [
                    { name: 'rules', type: ChannelType.GuildText, topic: 'Server rules and platform guidelines' },
                    { name: 'announcements', type: ChannelType.GuildText, topic: 'Platform releases, updates and maintenance' },
                    { name: 'plans', type: ChannelType.GuildText, topic: 'Details about Native Launch Plans (Bronze, Silver, Unlimited)' },
                    { name: 'guides', type: ChannelType.GuildText, topic: 'Quick start and bot deployment guides' }
                ]
            },
            {
                name: 'COMMUNITY',
                permissions: [
                    { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: memberRole.id, allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ] },
                    ...staffAllows
                ],
                channels: [
                    { name: 'general', type: ChannelType.GuildText, topic: 'General community discussion' },
                    { name: 'lounge', type: ChannelType.GuildText, topic: 'Chill and chat! Kollo kellont chat krnna thana ✌️' },
                    { name: 'setups', type: ChannelType.GuildText, topic: 'Share bot setups, mined shards and configs' },
                    { name: 'suggestions', type: ChannelType.GuildText, topic: 'Feature requests and platform feedback' }
                ]
            },
            {
                name: 'SUPPORT',
                permissions: [
                    { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: memberRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
                    ...staffAllows
                ],
                channels: [
                    { name: 'tickets', type: ChannelType.GuildText, topic: 'Create private customer support tickets' },
                    { name: 'status', type: ChannelType.GuildText, topic: 'Live platform status & payment confirmations' }
                ]
            },
            {
                name: 'VIP LOUNGE',
                permissions: [
                    { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: memberRole.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: vipRole.id, allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ] },
                    ...staffAllows
                ],
                channels: [
                    { name: 'vip-chat', type: ChannelType.GuildText, topic: 'Private lounge for Bronze, Silver & Unlimited subscribers' }
                ]
            },
            {
                name: 'VOICE',
                permissions: [
                    { id: everyoneRole.id, deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel] },
                    { id: memberRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak] },
                    ...staffAllows
                ],
                channels: [
                    { name: 'General VC', type: ChannelType.GuildVoice },
                    { name: 'Lounge VC', type: ChannelType.GuildVoice },
                    {
                        name: 'VIP VC',
                        type: ChannelType.GuildVoice,
                        permissionOverwrites: [
                            { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] },
                            { id: memberRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] },
                            { id: vipRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak] },
                            ...staffAllows
                        ]
                    },
                    {
                        name: 'Staff VC',
                        type: ChannelType.GuildVoice,
                        permissionOverwrites: [
                            { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] },
                            { id: memberRole.id, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] },
                            ...staffAllows
                        ]
                    }
                ]
            }
        ];

        for (const catDef of categoriesDef) {
            let category = await guild.channels.create({
                name: catDef.name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: catDef.permissions
            });
            log(`Created category: ${catDef.name}`);

            for (const chDef of catDef.channels) {
                let channel = await guild.channels.create({
                    name: chDef.name,
                    type: chDef.type,
                    parent: category.id,
                    topic: chDef.topic || undefined,
                    permissionOverwrites: chDef.permissionOverwrites || undefined
                });

                // Post initial content to special channels
                if (chDef.name === 'verify') {
                    await this.postVerificationPanel(channel);
                } else if (chDef.name === 'rules') {
                    await this.postRulesEmbed(channel);
                } else if (chDef.name === 'plans') {
                    await this.postPlansEmbed(channel);
                } else if (chDef.name === 'guides') {
                    await this.postGuidesEmbed(channel);
                } else if (chDef.name === 'tickets') {
                    await this.postTicketPanel(channel);
                }
            }
        }

        // Clean up temporary progress channel if it wasn't one of the new ones
        if (progressChannel && !progressChannel.deleted) {
            progressChannel.delete().catch(() => {});
        }

        console.log('[DiscordBot Setup] 🎉 Clean Server Setup Complete!');
    }

    async postRulesEmbed(channel) {
        const embed = new EmbedBuilder()
            .setTitle('Native Launch · Server Rules')
            .setColor(0x10B981)
            .setDescription(
                `Welcome to **Native Launch** — Autonomous Minecraft Fleet Cloud.\n\n` +
                `**1. Respect Everyone:** Maintain a polite and professional attitude. Harassment or hate speech will result in an immediate ban.\n` +
                `**2. No Spam or Self-Promotion:** Unauthorized links, advertisements, and spam are prohibited.\n` +
                `**3. Channel Purpose:** Keep discussions relevant to each channel (` + '`#general`' + `, ` + '`#lounge`' + `, ` + '`#suggestions`' + `).\n` +
                `**4. Support:** Open a ticket in <#tickets> for any account, proxy, or bot troubleshooting.\n` +
                `**5. Security:** Staff will never DM you first asking for passwords, tokens, or payment details.\n\n` +
                `🌐 **Web Control Plane:** [nativelaunch.xyz](https://nativelaunch.xyz)`
            )
            .setFooter({ text: 'Native Launch Community' });

        await channel.send({ embeds: [embed] }).catch(() => {});
    }

    async postPlansEmbed(channel) {
        const embed = new EmbedBuilder()
            .setTitle('Native Launch · Plans & Pricing')
            .setColor(0x3B82F6)
            .setDescription(
                `We offer flexible, high-performance plans for managing Minecraft bots seamlessly.\n\n` +
                `**🥉 Bronze Pro — $2.00 / mo**\n` +
                `• Run up to **3 Bots** concurrently\n` +
                `• Dedicated Control Panel Access\n\n` +
                `**🥈 Silver Pro — $5.00 / mo**\n` +
                `• Run up to **10 Bots** concurrently\n` +
                `• VIP Lounge Access\n\n` +
                `**🌟 Unlimited Pro — $12.00 / mo**\n` +
                `• Run **Unlimited Bots** concurrently\n` +
                `• Priority Queue & Exclusive Proxy Pool\n\n` +
                `**🎛️ Custom Tier**\n` +
                `• Expand your limits dynamically at **$0.50 per Bot** & **$0.50 per SOCKS5 Proxy**.`
            )
            .setFooter({ text: 'Pay securely via PayPal on our Web Dashboard' });

        await channel.send({ embeds: [embed] }).catch(() => {});
    }

    async postVerificationPanel(channel) {
        const embed = new EmbedBuilder()
            .setTitle('Member Verification')
            .setColor(0x10B981)
            .setDescription(
                `Welcome to **Native Launch**!\n\n` +
                `Click the **Verify** button below to accept the server rules and unlock community channels.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_btn')
                .setLabel('Verify')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }

    async postGuidesEmbed(channel) {
        const embed = new EmbedBuilder()
            .setTitle('Quick Start Guide · Native Launch')
            .setColor(0x3B82F6)
            .setDescription(
                `**Get started in 4 simple steps:**\n\n` +
                `**1. Register Account:** Go to [nativelaunch.xyz](https://nativelaunch.xyz) and sign up.\n` +
                `**2. Choose a Plan:** Visit \`/billing\` to pick a preset ($2 Bronze, $5 Silver, $12 Unlimited) or custom slider ($0.50/bot).\n` +
                `**3. Deploy a Bot:** Go to \`/bots\` -> **+ Add Bot** -> enter your Minecraft Server IP & Username.\n` +
                `**4. Multi-Console Matrix:** Navigate to \`/tiles\` to control your entire fleet from one unified screen.\n\n` +
                `Need help? Head over to <#tickets> to open a support ticket!`
            );

        await channel.send({ embeds: [embed] }).catch(() => {});
    }

    async postTicketPanel(channel) {
        const embed = new EmbedBuilder()
            .setTitle('Customer Support Desk')
            .setColor(0x10B981)
            .setDescription(
                `Need help with your bot fleet, billing, or proxies?\n\n` +
                `Click the button below to open a private ticket with our team.\n` +
                `• **Billing & PayPal Inquiries**\n` +
                `• **Technical Help & Bot Setup**\n` +
                `• **Dedicated Proxy Configuration**`
            )
            .setFooter({ text: 'Tickets are private between you and Staff' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_btn')
                .setLabel('Open Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫')
        );

        await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }

    /**
     * 💳 REAL-TIME PAYMENT & SUBSCRIPTION RELAY
     * Broadcasts confirmed PayPal payments and subscription upgrades to #status.
     */
    async broadcastPayment({ userEmail, planName, amount, orderId }) {
        if (!this.isReady) return;

        const guild = this.guildId ? this.client.guilds.cache.get(this.guildId) : this.client.guilds.cache.first();
        if (!guild) return;

        const statusChannel = guild.channels.cache.find(c => c.name === 'status' && c.type === ChannelType.GuildText);
        if (!statusChannel) return;

        // Mask email for privacy (e.g. sa***@gmail.com)
        const maskedEmail = String(userEmail || 'user').replace(/^(.)(.*)(@.*)$/, (match, first, middle, domain) => {
            return `${first}***${domain}`;
        });

        const embed = new EmbedBuilder()
            .setTitle('💳 New Subscription Activated')
            .setColor(0x10B981)
            .addFields(
                { name: 'Package', value: `**${planName}**`, inline: true },
                { name: 'Amount Paid', value: `**$${Number(amount || 0).toFixed(2)} / mo**`, inline: true },
                { name: 'Tenant', value: `\`${maskedEmail}\``, inline: true },
                { name: 'Status', value: '🟢 Confirmed & Provisioned ⚡', inline: true }
            )
            .setFooter({ text: `Order Ref: ${String(orderId || '').slice(-8)}` })
            .setTimestamp();

        await statusChannel.send({ embeds: [embed] }).catch(err => {
            console.error('[DiscordBot] Failed to broadcast payment:', err.message);
        });
    }

    async start() {
        if (!this.token) {
            console.log('[DiscordBot] ⚠️ No DISCORD_BOT_TOKEN found in environment. Bot is in standby.');
            return;
        }

        try {
            await this.client.login(this.token);
        } catch (err) {
            console.error('[DiscordBot] ❌ Failed to login to Discord:', err.message);
        }
    }
}

module.exports = NativeDiscordBot;

// If executed directly via CLI
if (require.main === module) {
    const bot = new NativeDiscordBot();
    bot.start();
}
