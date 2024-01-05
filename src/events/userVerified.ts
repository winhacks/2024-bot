import {GuildMember} from "discord.js";
import {SelectPlural} from "../helpers/misc";
import {ClientType, EventType} from "../types";
import {GetHackerCount} from "../helpers/database";

const userVerifiedModule: EventType = {
    eventName: "userVerified",
    once: false,
    execute: async (client: ClientType, member: GuildMember) => {
        const registeredCount = await GetHackerCount(false);
        const message = SelectPlural(
            registeredCount,
            "nobody 😦",
            "1 verified hacker",
            `${registeredCount} verified hackers`
        );

        client.user?.setPresence({
            status: "online",
            activities: [{type: "WATCHING", name: message}],
        });
    },
};

export {userVerifiedModule as event};
