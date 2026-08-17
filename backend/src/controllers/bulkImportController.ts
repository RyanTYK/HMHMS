import { Request, Response } from 'express';
import { bulkImportService } from '../services/bulkImportService';

/**
 * Parse and validate CSV file
 */
export const validateCSV = async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({ message: 'CSV content is required' });
    }

    // Parse CSV
    const monitors = bulkImportService.parseCSV(csvContent);

    // Validate monitors
    const errors = bulkImportService.validateMonitors(monitors);

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        validCount: monitors.length - errors.length,
        totalCount: monitors.length
      });
    }

    res.json({
      message: 'CSV validated successfully',
      monitors,
      count: monitors.length
    });
  } catch (error: any) {
    console.error('Error validating CSV:', error);
    res.status(400).json({ message: error.message || 'Failed to validate CSV' });
  }
};

/**
 * Import monitors from CSV
 */
export const importCSV = async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    const userId = (req as any).user.id;

    if (!csvContent) {
      return res.status(400).json({ message: 'CSV content is required' });
    }

    // Parse CSV
    const monitors = bulkImportService.parseCSV(csvContent);

    // Validate monitors
    const validationErrors = bulkImportService.validateMonitors(monitors);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed. Please fix errors before importing.',
        errors: validationErrors
      });
    }

    // Import monitors
    const result = await bulkImportService.importMonitors(monitors, userId);

    res.json({
      message: `Import completed. ${result.created} monitors created, ${result.failed} failed.`,
      ...result
    });
  } catch (error: any) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ message: error.message || 'Failed to import monitors' });
  }
};

/**
 * Download CSV template
 */
export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    const template = bulkImportService.generateTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=monitor-import-template.csv');
    res.send(template);
  } catch (error: any) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: error.message || 'Failed to generate template' });
  }
};
