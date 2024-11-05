// postgresql://neondb_owner:8wCxiEA0VLsD@ep-solitary-dawn-a8x24fqw.eastus2.azure.neon.tech/WasteFoodDonation?sslmode=require

import {neon} from '@neondatabase/serverless';

import {drizzle} from 'drizzle-orm/neon-http'

import *  as schema from './schema'

const sql = neon(process.env.DATABASE_URL)

export const db = drizzle(sql, {schema})

