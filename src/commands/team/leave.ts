import {CacheType, CommandInteraction} from "discord.js";
import {ErrorMessage, SafeReply, SuccessMessage} from "../../helpers/responses";
import {logger} from "../../logger";
import {HandleLeaveTeam, NotInGuildResponse} from "./team-shared";
import {Team} from "@prisma/client";

export const LeaveTeam = async (intr: CommandInteraction<CacheType>, team: Team) => {
    if (!intr.inGuild()) {
        return SafeReply(intr, NotInGuildResponse());
    }

    const leaveError = await HandleLeaveTeam(intr.guild!, intr.user, team);
    if (leaveError) {
        logger.error(leaveError);
        return SafeReply(intr, ErrorMessage({ephemeral: true}));
    } else {
        return await SafeReply(
            intr,
            SuccessMessage({
                message: `You left Team ${team.displayName} successfully.`,
            })
        );
    }
};
