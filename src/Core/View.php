<?php

declare(strict_types=1);

namespace Study114\Core;

final class View
{
    /**
     * @param array<string, mixed> $data
     */
    public static function render(string $view, array $data = [], ?string $layout = 'layouts/auth'): void
    {
        $viewFile = self::path($view);
        if (!is_file($viewFile)) {
            throw new \RuntimeException("View not found: {$view}");
        }

        extract($data, EXTR_SKIP);

        if ($layout === null) {
            require $viewFile;
            return;
        }

        $layoutFile = self::path($layout);
        if (!is_file($layoutFile)) {
            throw new \RuntimeException("Layout not found: {$layout}");
        }

        ob_start();
        require $viewFile;
        $content = ob_get_clean() ?: '';

        require $layoutFile;
    }

    private static function path(string $view): string
    {
        return dirname(__DIR__) . '/Views/' . str_replace('.', '/', $view) . '.php';
    }
}
