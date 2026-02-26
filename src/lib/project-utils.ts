import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import logger from '@/lib/logger'

/**
 * Maakt automatisch een document map aan voor een nieuw project
 * @param projectId - Het ID van het project
 * @param projectName - De naam van het project
 * @returns Promise<boolean> - True als succesvol, false bij fout
 */
export async function createProjectDocumentFolder(
  projectId: number | string, 
  projectName: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Maak een README bestand aan om de map structuur te creëren
    const readmeContent = `# Project Documenten: ${projectName}

Dit is de document map voor project **${projectName}**.

## Organisatie
- Upload hier alle project-gerelateerde documenten
- Bestanden worden automatisch gekoppeld aan dit project
- Ondersteunde formaten: PDF, afbeeldingen, tekst bestanden, en meer

## Aangemaakt
${new Date().toLocaleDateString('nl-NL')} om ${new Date().toLocaleTimeString('nl-NL')}
`

    const readmeBlob = new Blob([readmeContent], { type: 'text/markdown' })
    
    const { error } = await supabase.storage
      .from('user-assets')
      .upload(`projects/${projectId}/README.md`, readmeBlob, {
        contentType: 'text/markdown',
        upsert: false
      })

    if (error) {
      logger.apiError('createProjectDocumentFolder', 'Storage Upload', error)
      return false
    }

    logger.info(`Document map succesvol aangemaakt voor project ${projectId}: ${projectName}`)
    return true
    
  } catch (error) {
    logger.apiError('createProjectDocumentFolder', 'Exception', error)
    return false
  }
}

/**
 * Controleert of een project document map bestaat
 * @param projectId - Het ID van het project
 * @returns Promise<boolean> - True als map bestaat
 */
export async function projectDocumentFolderExists(projectId: number | string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase.storage
      .from('user-assets')
      .list(`projects/${projectId}`, {
        limit: 1
      })

    if (error) {
      return false
    }

    return data && data.length > 0
    
  } catch (error) {
    return false
  }
}

/**
 * Verwijdert de document map van een project (bij project verwijdering)
 * @param projectId - Het ID van het project
 * @returns Promise<boolean> - True als succesvol verwijderd
 */
export async function deleteProjectDocumentFolder(projectId: number | string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Haal alle bestanden in de project map op
    const { data: files, error: listError } = await supabase.storage
      .from('user-assets')
      .list(`projects/${projectId}`, {
        limit: 1000
      })

    if (listError) {
      logger.apiError('deleteProjectDocumentFolder', 'List Files', listError)
      return false
    }

    if (files && files.length > 0) {
      // Verwijder alle bestanden in de map
      const filePaths = files.map(file => `projects/${projectId}/${file.name}`)
      
      const { error: deleteError } = await supabase.storage
        .from('user-assets')
        .remove(filePaths)

      if (deleteError) {
        logger.apiError('deleteProjectDocumentFolder', 'Delete Files', deleteError)
        return false
      }
    }

    logger.info(`Document map succesvol verwijderd voor project ${projectId}`)
    return true
    
  } catch (error) {
    logger.apiError('deleteProjectDocumentFolder', 'Exception', error)
    return false
  }
}