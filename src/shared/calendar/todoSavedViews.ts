import { TODO_FILTERS, normalizeProject } from './todoModel';
import type { TodoFilter } from './todoModel';

type TodoSavedView = {
    id: string;
    name: string;
    searchValue: string;
    filter: TodoFilter;
    project: string | null;
    tag: string | null;
    createdAt: string | null;
};

type TodoSavedViewCriteria = {
    searchValue?: unknown;
    filter?: unknown;
    project?: unknown;
    tag?: unknown;
};

type TodoSavedViewActionResult =
    | { ok: true; view: TodoSavedView; views: TodoSavedView[] }
    | { ok: false; error: string };

const DEFAULT_SAVED_VIEW_NAME = 'Filtro';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeViewName(name: unknown, fallback = ''): string {
    const normalizedName = typeof name === 'string'
        ? name.replace(/\s+/g, ' ').trim()
        : '';

    return (normalizedName || fallback).slice(0, 40);
}

function normalizeSearchValue(searchValue: unknown): string {
    return typeof searchValue === 'string' ? searchValue.trim().slice(0, 80) : '';
}

function normalizeFilter(filter: unknown): TodoFilter {
    const validFilter = Object.values(TODO_FILTERS).find(value => value === filter);

    return validFilter || TODO_FILTERS.all;
}

function createSavedViewId(name: string): string {
    const slug = normalizeViewName(name, DEFAULT_SAVED_VIEW_NAME)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `view-${slug || 'local'}-${crypto.randomUUID()}`;
    }

    return `view-${slug || 'local'}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTodoSavedView(
    name: string,
    criteria: TodoSavedViewCriteria = {},
    options: { id?: string; now?: string | null } = {}
): TodoSavedView {
    return {
        id: options.id || createSavedViewId(name),
        name: normalizeViewName(name, DEFAULT_SAVED_VIEW_NAME),
        searchValue: normalizeSearchValue(criteria.searchValue),
        filter: normalizeFilter(criteria.filter),
        project: normalizeProject(criteria.project),
        tag: normalizeProject(criteria.tag),
        createdAt: options.now === undefined ? new Date().toISOString() : options.now,
    };
}

function normalizeTodoSavedViews(views: unknown): TodoSavedView[] {
    if (!Array.isArray(views)) {
        return [];
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    return views
        .filter(isRecord)
        .map((view, index) => {
            const id = typeof view.id === 'string' && view.id
                ? view.id
                : `view-${index + 1}`;
            const name = normalizeViewName(view.name, `Filtro ${index + 1}`);
            const nameKey = name.toLowerCase();

            if (seenIds.has(id) || seenNames.has(nameKey)) {
                return null;
            }

            seenIds.add(id);
            seenNames.add(nameKey);

            return {
                id,
                name,
                searchValue: normalizeSearchValue(view.searchValue),
                filter: normalizeFilter(view.filter),
                project: normalizeProject(view.project),
                tag: normalizeProject(view.tag),
                createdAt: typeof view.createdAt === 'string' ? view.createdAt : null,
            };
        })
        .filter((view): view is TodoSavedView => Boolean(view));
}

function addTodoSavedView(
    views: TodoSavedView[],
    name: string,
    criteria: TodoSavedViewCriteria
): TodoSavedViewActionResult {
    const viewName = normalizeViewName(name);

    if (!viewName) {
        return { ok: false, error: 'Escribe un nombre para estos filtros.' };
    }

    const normalizedViews = normalizeTodoSavedViews(views);
    const alreadyExists = normalizedViews.some(view =>
        view.name.toLowerCase() === viewName.toLowerCase()
    );

    if (alreadyExists) {
        return { ok: false, error: 'Ya existen filtros guardados con ese nombre.' };
    }

    const view = createTodoSavedView(viewName, criteria);

    return {
        ok: true,
        view,
        views: [...normalizedViews, view],
    };
}

function removeTodoSavedView(views: TodoSavedView[], viewId: string): TodoSavedView[] {
    return normalizeTodoSavedViews(views).filter(view => view.id !== viewId);
}

export {
    addTodoSavedView,
    createTodoSavedView,
    normalizeTodoSavedViews,
    removeTodoSavedView,
};

export type {
    TodoSavedView,
    TodoSavedViewActionResult,
};
