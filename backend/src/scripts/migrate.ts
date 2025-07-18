#!/usr/bin/env node

import { runMigrationsFromCLI } from '../utils/migrationRunner';

// Run migrations when this script is executed
runMigrationsFromCLI();