import {
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import {
    ButtonInteraction,
    CacheType,
    Client,
    Collection,
    CommandInteraction,
} from "discord.js";
import {Filter, Document as MongoDocument} from "mongodb";

export interface CommandType {
    data:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
    deferMode: "NORMAL" | "EPHEMERAL" | "NO-DEFER";
    execute: (interaction: CommandInteraction<CacheType>) => Promise<any>;
}

export interface EventType {
    eventName: string;
    once: boolean;
    execute: (client: ClientType, ...args: any[]) => Promise<any>;
}

export interface ButtonAction {
    execute: (interaction: ButtonInteraction<CacheType>) => Promise<any>;
}

export interface ClientType extends Client {
    commands: Collection<string, CommandType>;
}

export enum TeamAvailability {
    "NAME_EXISTS",
    "ALREADY_IN_TEAM",
    "AVAILABLE",
}

export type Query<T> = Filter<T>;
