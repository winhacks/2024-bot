import {GuildMember} from "discord.js";
import {logger} from "../logger";
import {ClientType, EventType} from "../types";
import {IsHackerVerified, SetHackerVerified} from "../helpers/database";

const memberLeaveModule: EventType = {
    eventName: "guildMemberRemove",
    once: false,
    execute: async (client: ClientType, member: GuildMember) => {
        const userIsVerified = await IsHackerVerified(member.id);
        if (!userIsVerified) {
            logger.info(`User ${member.id} left.`);
            return;
        }

        await SetHackerVerified(member.id, false);
        logger.info(`User ${member.id} left and was unverified.`);
        client.emit("userUnverified", member);
    },
};

export {memberLeaveModule as event};
