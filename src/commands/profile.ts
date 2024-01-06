import {SlashCommandBuilder, bold, userMention} from "@discordjs/builders";
import {CommandType} from "../types";
import {CacheType, CommandInteraction, GuildMember} from "discord.js";
import {GetHacker} from "../helpers/database";
import {ResponseEmbed, SafeReply} from "../helpers/responses";

const profileModule: CommandType = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View hacker profile"),
    deferMode: "NO-DEFER",
    execute: async (intr: CommandInteraction<CacheType>) => {
        const hacker = await GetHacker(intr.user.id);
        const verified = hacker ? ":white_check_mark:" : ":x:";
        const teamName = hacker?.team?.displayName ?? "No Team";

        const displayName = intr.inGuild()
            ? (intr.member as GuildMember).nickname ??
              (intr.member as GuildMember).displayName
            : intr.user.username;

        const embed = ResponseEmbed()
            .setTitle("Profile of " + displayName)
            .setDescription(
                [
                    `${bold("Verified")}: ${verified}`, //
                    `${bold("Team")}: ${teamName}`,
                ].join("\n")
            );
        return SafeReply(intr, {embeds: [embed]});
    },
};

export {profileModule as command};
