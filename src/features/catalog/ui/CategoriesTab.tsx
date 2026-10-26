import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, Modal, Skeleton } from '@/shared/ui';
import { catalogWrites, useCategories } from '../application/useCatalog';
import { sortCategories, type Category, type CategoryInput } from '../domain/category';
import { CategoryForm } from './CategoryForm';

type Editing = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

export function CategoriesTab() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const categories = useCategories(business.id);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const list = sortCategories(categories.data ?? []);

  const save = (input: CategoryInput) => {
    if (editing?.mode === 'edit')
      catalogWrites.updateCategory(business.id, editing.category.id, input);
    else catalogWrites.createCategory(business.id, input, user.uid);
    toast({ title: t('common.saved'), tone: 'success' });
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="self-end"
        leftIcon={<Plus aria-hidden className="size-5" />}
        onClick={() => {
          setEditing({ mode: 'create' });
        }}
      >
        {t('catalog.newCategory')}
      </Button>
      {categories.isPending ? <Skeleton className="h-40" /> : null}
      {!categories.isPending && list.length === 0 ? (
        <EmptyState
          icon={<Tags />}
          title={t('catalog.emptyCategories')}
          description={t('catalog.emptyCategoriesHint')}
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {list.map((category) => (
            <li key={category.id} className="flex items-center gap-3 px-4 py-2">
              <Badge tone={category.color}>{category.name}</Badge>
              <span className="flex-1" />
              <IconButton
                label={`${t('common.edit')} ${category.name}`}
                icon={<Pencil />}
                onClick={() => {
                  setEditing({ mode: 'edit', category });
                }}
              />
              <IconButton
                label={t('catalog.deleteCategory', { name: category.name })}
                icon={<Trash2 />}
                variant="danger"
                onClick={() => {
                  setDeleting(category);
                }}
              />
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.mode === 'edit' ? t('catalog.editCategory') : t('catalog.newCategory')}
        footer={
          <Button type="submit" form="category-form">
            {t('common.save')}
          </Button>
        }
      >
        {editing ? (
          <CategoryForm
            category={editing.mode === 'edit' ? editing.category : null}
            nextSortOrder={list.length}
            onSubmit={save}
          />
        ) : null}
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t('catalog.deleteCategoryConfirm', { name: deleting?.name ?? '' })}
        description={t('catalog.deleteCategoryHint')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={() => {
          if (deleting) catalogWrites.deleteCategory(business.id, deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
