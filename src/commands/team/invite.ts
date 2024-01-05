import {
    CacheType,
    CommandInteraction,
    GuildMember,
    Message,
    MessageActionRow,
    MessageButton,
    TextChannel,
} from "discord.js";
import {Config} from "../../config";
import {
    ErrorMessage,
    ResponseEmbed,
    SafeDeferReply,
    SafeReply,
} from "../../helpers/responses";
import {NotInGuildResponse, TeamFullResponse} from "./team-shared";
import {MessageButtonStyles} from "discord.js/typings/enums";
import {hyperlink, userMention} from "@discordjs/builders";
import {Team} from "@prisma/client";
import {
    UpsertInvite,
    GetMembersOfTeam,
    GetUserInvites,
    IsUserVerified,
} from "../../helpers/database";

export const InviteToTeam = async (
    intr: CommandInteraction<CacheType>,
    team: Team
): Promise<any> => {
    if (!intr.inGuild()) {
        return SafeReply(intr, NotInGuildResponse());
    }

    const invitee = intr.options.getUser("user", true);
    await SafeDeferReply(intr);

    // trivial check to see if a user is inviting themself
    if (intr.user.id === invitee.id && !Config.dev_mode) {
        return SafeReply(
            intr,
            ErrorMessage({
                emote: ":thinking:",
                title: "You're Already In Your Team",
                message: [
                    "You tried to invite yourself to your own team. Sadly,",
                    "cloning hasn't been invented yet.",
                ].join(" "),
            })
        );
    }

    const teamMembers = await GetMembersOfTeam(team.displayName);
    const teamMemberIds = teamMembers.map((member) => member.discordId);

    if (teamMemberIds.length >= Config.teams.max_team_size) {
        return SafeReply(intr, TeamFullResponse());
    }

    /**
     * Beyond not inviting yourself, an invite must meet the following:
     * 1. The invitee must be verified,
     * 2. The invitee must not be in your team, and
     * 3. The invitee must not have already been invited.
     */

    const inviteeVerified = await IsUserVerified(invitee.id);
    if (!inviteeVerified) {
        return SafeReply(
            intr,
            ErrorMessage({
                title: "User Not Verified",
                message: [
                    "You can only invite verified users to your team.",
                    "Ask them to verify first with `/verify`.",
                ].join(" "),
            })
        );
    }

    if (teamMemberIds.includes(invitee.id)) {
        return SafeReply(
            intr,
            ErrorMessage({
                emote: ":thinking:",
                title: "Member Already In Your Team",
                message: `${invitee} is already a member of your team.`,
            })
        );
    }

    const invite = await UpsertInvite(invitee.id, team.stdName);
    if (!invite) {
        const mention = userMention(invitee.id);
        return SafeReply(
            intr,
            ErrorMessage({
                title: "Failed to Invite " + mention,
                message: `Something went wrong while inviting ${mention}. Please try again in about a minute.`,
            })
        );
    }

    // NOTE: custom IDs must be of form "invite;ACTION;TEAM_STD_NAME"
    const buttonRow = new MessageActionRow().setComponents(
        new MessageButton()
            .setStyle(MessageButtonStyles.SECONDARY)
            .setCustomId(`invite;decline;${team.stdName}`)
            .setLabel("Decline"),
        new MessageButton()
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(`invite;accept;${team.stdName}`)
            .setLabel("Accept")
    );
    const inviteMsg = ResponseEmbed()
        .setTitle(":partying_face: You've Been Invited")
        .setDescription(
            [
                `You've been invited to join Team ${team.displayName}`,
                `for ${Config.bot_info.event_name} by`,
                `${(intr.member! as GuildMember).displayName}.`,
            ].join(" ")
        );

    let message: Message<boolean> | null = null;
    await invitee
        .send({
            embeds: [inviteMsg],
            components: [buttonRow],
        })
        .then((m) => (message = m))
        .catch(() => (message = null));

    if (message === null) {
        return SafeReply(
            intr,
            ErrorMessage({
                title: `Unable to DM ${userMention(invitee.id)}`,
                message: [
                    `It seems ${invitee} doesn't allow DMs from this server. Please ask them to`,
                    hyperlink(
                        "enable direct messages",
                        "https://support.discord.com/hc/articles/217916488-Blocking-Privacy-Settings"
                    ),
                    `and then re-invite them.`,
                ].join(" "),
            })
        );
    }

    const teamText = (await intr.guild!.channels.fetch(
        team.textChannelId
    )) as TextChannel | null;
    const invitedMember = await intr.guild!.members.fetch(invitee.id)!;
    const invitedEmbed = ResponseEmbed()
        .setTitle(":white_check_mark: Invite Sent")
        .setDescription(`${invitedMember.displayName} has been invited.`);

    // If we are in the team text channel, we should reply non-ephemerally.
    // If we are not in the team text channel, then we should reply ephemerally
    // and push a notification to the team text channel.

    if (intr.channelId === teamText?.id) {
        return SafeReply(intr, {embeds: [invitedEmbed]});
    } else {
        await teamText?.send({embeds: [invitedEmbed]});
        return SafeReply(intr, {embeds: [invitedEmbed], ephemeral: true});
    }
};
