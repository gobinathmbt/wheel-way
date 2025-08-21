
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ConfigurationListProps {
  configs: any[];
  selectedConfig: any;
  onSelectConfig: (config: any) => void;
  onEditConfig: (config: any) => void;
  onDeleteConfig: (config: any) => void;
  pagination?: any;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const ConfigurationList: React.FC<ConfigurationListProps> = ({
  configs,
  selectedConfig,
  onSelectConfig,
  onEditConfig,
  onDeleteConfig,
  pagination,
  currentPage,
  onPageChange,
  isLoading
}) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading configurations...</div>;
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No configurations found
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {configs.map((config: any) => (
          <div
            key={config._id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedConfig?._id === config._id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onSelectConfig(config)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold truncate">
                {config.config_name}
              </h3>
              <div className="flex gap-1 ml-2">
                {config.is_active && (
                  <Badge className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
                {!config.is_active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {config.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>v{config.version}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditConfig(config);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConfig(config);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from(
              { length: pagination.total_pages },
              (_, i) => i + 1
            ).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={page === currentPage}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(
                    Math.min(pagination.total_pages, currentPage + 1)
                  )
                }
                className={
                  currentPage === pagination.total_pages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

export default ConfigurationList;
