import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

async function promptAndClick(page: Page, value: string, action: () => Promise<void>) {
  const dialog = page.waitForEvent('dialog')
  const click = action()
  await (await dialog).accept(value)
  await click
}

async function visit(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as HTMLElement & { __vue_app__?: unknown })?.__vue_app__))
}

async function createCampaign(page: Page, request: APIRequestContext) {
  const existing = await request.get('http://127.0.0.1:4173/api/campaigns')
  expect(existing.ok()).toBeTruthy()
  let campaign = (await existing.json() as { id: number, name: string }[]).find(item => item.name === 'E2E Campaign')
  if (!campaign) {
    const response = await request.post('http://127.0.0.1:4173/api/campaigns', {
      data: { name: 'E2E Campaign', description: 'Campaign created by the browser suite' },
    })
    expect(response.ok()).toBeTruthy()
    campaign = await response.json() as { id: number, name: string }
  }
  await page.context().addCookies([{ name: 'activeCampaignId', value: String(campaign.id), domain: '127.0.0.1', path: '/' }])
  await page.addInitScript(() => {
    localStorage.setItem('dm-hero-last-seen-announcement', '6')
    localStorage.setItem('dm-hero-feature-tips-disabled', '1')
  })
  await visit(page, '/')
}

test.describe.serial('campaign narrative authoring', () => {
  test.describe.configure({ timeout: 120_000 })
  test('creates, edits, validates, and persists manuscript, quests, and dialogue', async ({ page, request }) => {
    await createCampaign(page, request)

    await visit(page, '/manuscript')
    for (const [type, title] of [['book', 'Act I'], ['part', 'Part One'], ['chapter', 'Chapter One']] as const) {
      await promptAndClick(page, title, () => page.getByTestId(`manuscript-add-${type}`).click())
      await expect(page.getByTestId(`manuscript-section-${title}`)).toBeVisible()
    }
    await promptAndClick(page, 'Opening Scene', () => page.getByTestId('manuscript-add-scene').click())
    await expect(page.getByTestId('manuscript-section-Opening Scene')).toBeVisible()
    await page.getByTestId('manuscript-section-Opening Scene').click()
    await page.getByTestId('manuscript-title').locator('input').fill('The Opening')
    await page.getByTestId('manuscript-title').locator('input').blur()
    await page.getByRole('combobox', { name: 'Level' }).click({ force: true })
    await page.getByRole('option', { name: 'scene', exact: true }).click()
    await page.getByLabel('Viewpoint').fill('Aria')
    await page.getByLabel('Viewpoint').blur()
    await page.getByLabel('Story date').fill('2026-01-01')
    await page.getByLabel('Story date').blur()
    await page.locator('.entity-markdown-editor [contenteditable="true"]').fill('# The Opening')
    await page.locator('.entity-markdown-editor [contenteditable="true"]').blur()
    await page.getByTestId('manuscript-section-Act I').getByTestId('manuscript-move-down').click()
    await page.getByTestId('manuscript-section-Part One').getByTestId('manuscript-move-up').click()
    await page.getByText('Revisions').click()
    await expect(page.getByTestId('manuscript-restore-revision').first()).toBeVisible()
    await page.getByTestId('manuscript-restore-revision').first().click()
    await page.reload()
    await expect(page.getByTestId('manuscript-section-The Opening')).toBeVisible()

    await visit(page, '/quests')
    await promptAndClick(page, 'Main Quest', () => page.getByTestId('quest-add').click())
    await expect(page.getByTestId('quest-Main Quest')).toBeVisible()
    await page.getByTestId('quest-Main Quest').click()
    await page.getByTestId('quest-title').locator('input').fill('Saved Main Quest')
    await page.getByTestId('quest-title').locator('input').blur()
    await page.getByLabel('Description').fill('Find the lost crown.')
    await page.getByLabel('Description').blur()
    await page.getByLabel('Recovery / convergence notes').fill('The crown can be recovered from the vault.')
    await page.getByLabel('Recovery / convergence notes').blur()
    await page.getByRole('combobox', { name: 'Status' }).click({ force: true })
    await page.getByRole('option', { name: 'active', exact: true }).click()
    await promptAndClick(page, 'Find the clue', () => page.getByTestId('quest-add-objective').click())
    await expect(page.getByTestId('quest-objective-Find the clue')).toBeVisible()
    await page.getByTestId('quest-objective-Find the clue').locator('input[role="combobox"]').click({ force: true })
    await page.getByRole('option', { name: 'completed', exact: true }).click()
    await page.getByTestId('quest-objective-Find the clue').getByTestId('quest-objective-delete').click()
    await expect(page.getByTestId('quest-objective-Find the clue')).toHaveCount(0)
    const transitionPrompts = ['available', 'active']
    page.on('dialog', dialog => dialog.accept(transitionPrompts.shift()))
    await page.getByTestId('quest-add-transition').click()
    page.removeAllListeners('dialog')
    await expect(page.getByText('available → active')).toBeVisible()
    const secondQuestResponse = page.waitForResponse(response => response.url().endsWith('/quests') && response.request().method() === 'POST')
    await promptAndClick(page, 'Dependency Quest', () => page.getByTestId('quest-add').click())
    const secondQuest = await (await secondQuestResponse).json() as { id: number }
    await page.getByTestId('quest-Saved Main Quest').click()
    await promptAndClick(page, String(secondQuest.id), () => page.getByTestId('quest-add-dependency').click())
    await expect(page.getByTestId('quest-Dependency Quest')).toBeVisible()
    await page.getByTestId('quest-validate').click()
    await expect(page.getByText('No quest validation issues.')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('quest-Saved Main Quest')).toBeVisible()

    await visit(page, '/dialogues')
    await promptAndClick(page, 'Gatekeeper', () => page.getByTestId('dialogue-add').click())
    await expect(page.getByTestId('dialogue-Gatekeeper')).toBeVisible()
    await page.getByTestId('dialogue-Gatekeeper').click()
    const lineResponse = page.waitForResponse(response => response.url().includes('/nodes') && response.request().method() === 'POST')
    await page.getByTestId('dialogue-add-line').click()
    expect((await lineResponse).ok()).toBeTruthy()
    await expect(page.getByTestId('dialogue-node')).toHaveCount(1)
    await page.getByTestId('dialogue-add-ending').click()
    await expect(page.getByTestId('dialogue-node')).toHaveCount(2)
    const firstLine = page.getByTestId('dialogue-node').filter({ has: page.getByLabel('line') }).first()
    await firstLine.locator('input').first().fill('Halt, traveller.')
    await firstLine.locator('input').first().blur()
    await page.getByTestId('dialogue-tab-canvas').click()
    const nodes = page.locator('.vue-flow__node')
    await expect(nodes).toHaveCount(2)
    await nodes.nth(0).dragTo(nodes.nth(1))
    await nodes.nth(0).locator('.vue-flow__handle.source').dragTo(nodes.nth(1).locator('.vue-flow__handle.target'))
    await page.getByRole('tab', { name: 'Transcript' }).click()
    await expect(page.getByTestId('dialogue-edge')).toHaveCount(1)
    await page.getByTestId('dialogue-edge').getByTestId('dialogue-edge-delete').click()
    await expect(page.getByTestId('dialogue-edge')).toHaveCount(0)
    await page.getByTestId('dialogue-validate').click()
    await page.getByTestId('dialogue-simulate').click()
    await expect(page.getByText('Trace:')).toBeVisible()
    await page.getByTestId('dialogue-node').last().getByTestId('dialogue-node-delete').click()
    await expect(page.getByTestId('dialogue-node')).toHaveCount(1)
    await page.reload()
    await expect(page.getByTestId('dialogue-Gatekeeper')).toBeVisible()
  })

  test('surfaces narrative data in dashboard, search, export, and import', async ({ page, request }) => {
    await createCampaign(page, request)
    await visit(page, '/')
    await expect(page.getByTestId('narrative-summary')).toContainText('1 scenes')
    await expect(page.getByTestId('narrative-summary')).toContainText('2 quests')
    await expect(page.getByTestId('narrative-summary')).toContainText('1 dialogue graphs')
    await page.getByTestId('dashboard-open-manuscript').click()
    await expect(page).toHaveURL(/\/manuscript$/)

    await page.keyboard.press('/')
    await page.getByTestId('global-search-input').fill('Opening')
    await expect(page.getByText('The Opening', { exact: true })).toBeVisible()
    await page.getByText('The Opening', { exact: true }).last().click()
    await expect(page).toHaveURL(/\/manuscript$/)

    await visit(page, '/')
    await page.getByTestId('campaign-export').click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('campaign-export-download').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.dmhero$/)
    const exportPath = await download.path()
    expect(exportPath).not.toBeNull()

    await page.getByTestId('campaign-import').click()
    await page.getByTestId('campaign-import-file').locator('input[type=file]').setInputFiles(exportPath!)
    await expect(page.getByTestId('campaign-import-name')).toBeVisible()
    await page.getByTestId('campaign-import-name').fill('Imported E2E Campaign')
    await page.getByTestId('campaign-import-confirm').click()
    await expect(page.getByTestId('campaign-import-success')).toBeVisible()
  })
})
