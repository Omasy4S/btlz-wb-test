import { Knex } from "knex";
/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex: Knex): Promise<void> {
    await knex("spreadsheets")
        .insert([{ spreadsheet_id: "1-4PQMJzV2xs85uGjdHAFeLGwTA7qlbJFj38uzFyeVfE" }])
        .onConflict(["spreadsheet_id"])
        .ignore();
}