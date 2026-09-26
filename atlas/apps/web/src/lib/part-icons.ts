/**
 * One line icon per part of the stack (24-unit stroke paths), used by the
 * home dashboard's tiles: foundations (flask), data (store), architecture
 * (layers), training (curve up), hardware (chip), post-training (target),
 * inference (bolt), serving (racks), agents (agent), multimodal (eye),
 * evaluation (shield with check).
 */
export const PART_ICON: Readonly<Record<number, string>> = {
  1: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9',
  2: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  3: 'M12 3 3 7.5l9 4.5 9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  4: 'M3 20h18M4 16l5-5 4 3 7-8M15 6h5v5',
  5: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  6: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2z',
  7: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  8: 'M4 4h16v6H4zM4 14h16v6H4zM7.5 7h.01M7.5 17h.01M11 7h6M11 17h6',
  9: 'M5 9h14v10H5zM12 9V5M10 5h4M9 13h.01M15 13h.01M9 16h6M3 13v3M21 13v3',
  10: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
  11: 'M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3zM8.5 12l2.5 2.5 4.5-5',
};
