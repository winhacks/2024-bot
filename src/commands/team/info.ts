import {CacheType, CommandInteraction} from "discord.js";
import {ResponseEmbed, SafeReply} from "../../helpers/responses";
import {NotInGuildResponse} from "./team-shared";
import {Team} from "@prisma/client";
import {GetMembersOfTeam} from "../../helpers/database";
import {channelMention, userMention} from "@discordjs/builders";

export const TeamInfo = async (
    intr: CommandInteraction<CacheType>,
    team: Team
): Promise<any> => {
    if (!intr.inGuild()) {
        return SafeReply(intr, NotInGuildResponse());
    }

    const members = (await GetMembersOfTeam(team.stdName))
        .map((member) => member.discordId)
        .map(userMention);
    const channels = [
        channelMention(team.textChannelId),
        channelMention(team.voiceChannelId),
    ];

    const embed = ResponseEmbed()
        .setTitle(team.displayName)
        .addField("Team Members:", members.join("\n"))
        .addField("Team Channels", channels.join("\n"));

    return SafeReply(intr, {embeds: [embed]});
};
