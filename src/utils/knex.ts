/**
 * CLI утилита для работы с Knex миграциями и seeds
 * Используется через npm run knex:dev
 * 
 * Примеры:
 * - npm run knex:dev migrate latest
 * - npm run knex:dev migrate rollback
 * - npm run knex:dev seed run
 */

import { migrate, seed } from "#postgres/knex.js";
import { Command } from "commander";

const program = new Command();

// Команды для миграций
program
    .command("migrate")
    .argument("[type]", "latest|rollback|down|up|list|make")
    .argument("[arg]", "migration name or version")
    .action(async (action, arg) => {
        if (!action) return;
        
        if (action === "latest") await migrate.latest();
        if (action === "rollback") await migrate.rollback();
        if (action === "down") await migrate.down(arg);
        if (action === "up") await migrate.up(arg);
        if (action === "list") await migrate.list();
        if (action === "make") await migrate.make(arg);
        
        process.exit(0);
    });

// Команды для seeds
program
    .command("seed [action] [arg]")
    .action(async (action, arg) => {
        if (!action) return;
        
        if (action === "run") await seed.run();
        if (action === "make") await seed.make(arg);
        
        process.exit(0);
    });

// Команда по умолчанию (ничего не делает)
program.command("default", { isDefault: true }).action(() => {});

program.parse();
