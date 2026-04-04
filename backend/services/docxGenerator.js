/**
 * Generates a Word (.docx) audit trail document explaining
 * how each IC Output row was calculated.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, BorderStyle, AlignmentType, WidthType, PageBreak,
  ShadingType
} = require('docx');

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '999999' }
};

/**
 * Create a styled heading paragraph.
 */
function heading(text, level) {
  return new Paragraph({ text, heading: level, spacing: { before: 200, after: 100 } });
}

/**
 * Create a key-value table (2 columns) from an object or array of [key, value] pairs.
 */
function makeKVTable(pairs) {
  const rows = pairs.map(([key, value]) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS,
          shading: { type: ShadingType.SOLID, color: 'F2F2F2' },
          children: [new Paragraph({
            children: [new TextRun({ text: String(key), bold: true, size: 20 })],
            spacing: { before: 40, after: 40 }
          })]
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS,
          children: [new Paragraph({
            children: [new TextRun({ text: String(value != null ? value : ''), size: 20 })],
            spacing: { before: 40, after: 40 }
          })]
        })
      ]
    })
  );

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

/**
 * Create a formula block - highlighted text showing a calculation.
 */
function formulaBlock(label, formula) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: String(formula), italics: true, size: 20, color: '2E75B6' })
    ]
  });
}

/**
 * Simple text paragraph.
 */
function textPara(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    spacing: { before: 40, after: 40 }
  });
}

/**
 * Build document sections for a single row's audit trail.
 */
function buildRowSection(trace, outputRow, headers, rowNum, isLastRow) {
  const children = [];
  const pm = trace.planMaster || {};
  const empId = trace.employee ? trace.employee.empId : '';
  const wuId = trace.territory ? trace.territory.wuId : '';
  const planType = pm.planType || '';

  // Row heading
  children.push(heading(
    `Row ${rowNum}: ${empId} | ${wuId} | ${planType}`,
    HeadingLevel.HEADING_1
  ));

  // 1. Output Values
  children.push(heading('Output Values', HeadingLevel.HEADING_2));
  const outputPairs = headers.map((h, i) => [h, outputRow[i]]);
  children.push(makeKVTable(outputPairs));

  // 2. Plan Master Match
  children.push(heading('Step 1: Plan Master Match', HeadingLevel.HEADING_2));
  children.push(textPara('The following Plan Master row was matched for this output:'));
  children.push(makeKVTable([
    ['Country Code', pm.countryCode],
    ['Team ID', pm.teamId],
    ['BU ID', pm.buId],
    ['Level Name', pm.levelName],
    ['Brand', pm.brand],
    ['Channel', pm.channel],
    ['Data Type', pm.dataType],
    ['Plan Type', pm.planType],
    ['Plan Period', pm.planPeriod],
    ['Payout Curve', pm.payoutCurve],
    ['Component Weight', pm.componentWeight],
    ['Level of Metric Measurement', pm.lom],
    ['Annual Target Pay (ATP)', pm.atp],
    ['Draw Multiplier (DM)', pm.dm],
    ['Attainment Rounding', pm.attRounding],
    ['Pct Payout Rounding', pm.pctRounding],
    ['Payout Rounding', pm.payRounding]
  ]));

  // 3. Territory Match
  children.push(heading('Step 2: Territory Match', HeadingLevel.HEADING_2));
  if (trace.territory) {
    children.push(textPara(`Searched Terr Hierarchy for: ${trace.territory.matchCriteria}`));
    children.push(makeKVTable([
      ['WorkUnit ID', trace.territory.wuId],
      ['WorkUnit Name', trace.territory.workUnitName],
      ['Level Name', trace.territory.levelName],
      ['Role Name', trace.territory.roleName]
    ]));
  }

  // 4. Employee Assignment
  children.push(heading('Step 3: Employee Assignment', HeadingLevel.HEADING_2));
  children.push(textPara(
    `Looked up employees assigned to WorkUnit "${wuId}" from Employee Assignment Input.`
  ));
  children.push(makeKVTable([['Employee ID', empId]]));

  // 5. Target Pay
  children.push(heading('Step 4: Target Pay Calculation', HeadingLevel.HEADING_2));
  if (trace.targetPay) {
    children.push(formulaBlock('Formula', 'Target Pay = ATP x Draw Multiplier x Component Weight'));
    children.push(formulaBlock('Calculation', trace.targetPay.formula));
    if (trace.targetPay.rounding != null) {
      children.push(formulaBlock('Rounding', `Rounded to ${trace.targetPay.rounding} decimal places`));
    }
    children.push(formulaBlock('Result', trace.targetPay.value));
  }

  // 5/6. Sales & Goals OR MBO
  if (planType === 'Goal Attainment') {
    children.push(heading('Step 5: Sales & Goals Lookup', HeadingLevel.HEADING_2));
    if (trace.salesGoals) {
      const sg = trace.salesGoals;
      children.push(textPara(
        `Level of Measurement (LOM) = "${pm.lom}". ` +
        (sg.walkUpPath.length > 1
          ? `Walked up hierarchy from ${sg.walkUpPath[0]} to find WU at LOM level: ${sg.salesWU}. Path: ${sg.walkUpPath.join(' -> ')}`
          : `WorkUnit "${sg.salesWU}" is already at the LOM level.`)
      ));
      children.push(makeKVTable([
        ['Lookup Key', sg.lookupKey],
        ['Sales Found?', sg.salesFound ? 'Yes' : 'No'],
        ['Sales Value', sg.salesValue],
        ['Goals Found?', sg.goalsFound ? 'Yes' : 'No'],
        ['Goals Value', sg.goalsValue]
      ]));
    }

    // Attainment
    children.push(heading('Step 6: Attainment Calculation', HeadingLevel.HEADING_2));
    if (trace.attainment) {
      children.push(formulaBlock('Formula', 'Attainment = Sales / Goals'));
      children.push(formulaBlock('Calculation', trace.attainment.formula));
      if (trace.attainment.rounding != null) {
        children.push(formulaBlock('Rounding', `Rounded to ${trace.attainment.rounding} decimal places`));
      }
      children.push(formulaBlock('Result', trace.attainment.roundedValue));
    }
  } else if (planType === 'MBO') {
    children.push(heading('Step 5: MBO Score Lookup', HeadingLevel.HEADING_2));
    if (trace.mbo) {
      children.push(makeKVTable([
        ['Lookup Key', trace.mbo.lookupKey],
        ['Score Found?', trace.mbo.scoreFound ? 'Yes' : 'No'],
        ['MBO Score', trace.mbo.score]
      ]));
    }
    children.push(heading('Step 6: Attainment', HeadingLevel.HEADING_2));
    if (trace.attainment) {
      children.push(formulaBlock('Value', trace.attainment.formula));
    }
  } else if (planType === 'Average of Underlying Terrs') {
    children.push(heading('Step 5: Child Territory Aggregation', HeadingLevel.HEADING_2));
    if (trace.managerDetail) {
      const md = trace.managerDetail;
      children.push(textPara(
        `Manager territory "${wuId}" has ${md.childCount} child territories: ${md.childWuIds.join(', ')}`
      ));
      children.push(textPara('Pre-Eligibility Earnings per child territory:'));

      const childPairs = md.childBreakdown.map(c =>
        [`${c.childWuId} (${c.matchingRowCount} rows)`, c.totalPreElig]
      );
      children.push(makeKVTable(childPairs));

      children.push(formulaBlock('Sum of Child Totals', md.sumOfChildTotals));
      children.push(formulaBlock('Average', md.avgFormula));
      children.push(formulaBlock('Manager Pre-Elig (x1.5)', md.mgrFormula));
    }
  }

  // Pay Curve (for GA and MBO only)
  if (planType !== 'Average of Underlying Terrs') {
    children.push(heading('Step 7: Pay Curve Lookup', HeadingLevel.HEADING_2));
    if (trace.payCurve) {
      const pc = trace.payCurve;
      children.push(makeKVTable([
        ['Curve Type', pc.curveType],
        ['Method', pc.method || 'N/A'],
        ['Curve Points Count', pc.curvePointCount || 'N/A']
      ]));
      if (pc.lowerPoint && pc.upperPoint) {
        children.push(textPara('Interpolation bracket:'));
        children.push(makeKVTable([
          ['Lower Point', `Achievement=${pc.lowerPoint.achievement}, Payout=${pc.lowerPoint.payout}`],
          ['Upper Point', `Achievement=${pc.upperPoint.achievement}, Payout=${pc.upperPoint.payout}`],
          ['Ratio', pc.ratio]
        ]));
        if (pc.formula) {
          children.push(formulaBlock('Interpolation', pc.formula));
        }
      }
      if (pc.bound) {
        children.push(textPara(`Bound: Achievement=${pc.bound.achievement}, Payout=${pc.bound.payout}`));
      }
      children.push(formulaBlock('Raw Percent To Target', pc.rawPercentToTarget));
      if (pc.rounding != null) {
        children.push(formulaBlock('Rounding', `Rounded to ${pc.rounding} decimal places`));
      }
      children.push(formulaBlock('Rounded Percent To Target', pc.roundedPercentToTarget));
    }
  }

  // Eligibility
  const eligStep = planType === 'Average of Underlying Terrs' ? '6' : '8';
  children.push(heading(`Step ${eligStep}: Eligibility`, HeadingLevel.HEADING_2));
  if (trace.eligibility) {
    const e = trace.eligibility;
    children.push(textPara(`Eligibility lookup key: "${e.lookupKey}"`));
    children.push(makeKVTable([
      ['NH Eligibility Found?', e.nhEligFound ? 'Yes' : 'No (defaulting to 0)'],
      ['New Hire Eligibility', e.nhElig],
      ['Perf Eligibility Found?', e.perfEligFound ? 'Yes' : 'No (defaulting to 1)'],
      ['Performance Eligibility', e.perfElig],
      ['IC Eligibility', e.icElig],
      ['IC Eligibility Rule', e.icEligFormula]
    ]));
  }

  // Pre-Eligibility Earnings
  const preEligStep = planType === 'Average of Underlying Terrs' ? '7' : '9';
  children.push(heading(`Step ${preEligStep}: Pre-Eligibility Earnings`, HeadingLevel.HEADING_2));
  if (trace.preEligEarnings) {
    children.push(formulaBlock('Calculation', trace.preEligEarnings.formula));
    children.push(formulaBlock('Result', trace.preEligEarnings.value));
  }

  // Payout
  const payoutStep = planType === 'Average of Underlying Terrs' ? '8' : '10';
  children.push(heading(`Step ${payoutStep}: Final Payout`, HeadingLevel.HEADING_2));
  if (trace.payout) {
    children.push(formulaBlock('Formula', 'Payout = Pre-Eligibility Earnings x IC Eligibility'));
    children.push(formulaBlock('Calculation', trace.payout.formula));
    children.push(formulaBlock('Result', trace.payout.value));
  }

  // ZFIR Key
  const zfirStep = planType === 'Average of Underlying Terrs' ? '9' : '11';
  children.push(heading(`Step ${zfirStep}: Key for ZFIR`, HeadingLevel.HEADING_2));
  if (trace.zfirKey) {
    children.push(formulaBlock('Components', JSON.stringify(trace.zfirKey.components)));
    children.push(formulaBlock('Concatenation', trace.zfirKey.formula));
    children.push(formulaBlock('Result', trace.zfirKey.value));
  }

  // Page break after each row except the last
  if (!isLastRow) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  return children;
}

/**
 * Generate a full audit trail .docx document for all output rows.
 * @param {Array} auditTrails - Array of audit trail objects
 * @param {Array} outputRows - Array of output row arrays
 * @param {Array} headers - OUTPUT_HEADERS
 * @returns {Promise<Buffer>}
 */
async function generateFullAuditDocx(auditTrails, outputRows, headers) {
  const allChildren = [];

  // Title
  allChildren.push(new Paragraph({
    children: [new TextRun({
      text: 'IC Calculation Audit Trail',
      bold: true,
      size: 36,
      color: '2E4057'
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 }
  }));

  allChildren.push(new Paragraph({
    children: [new TextRun({
      text: `Generated: ${new Date().toISOString().split('T')[0]}  |  Total Rows: ${outputRows.length}`,
      size: 22,
      color: '666666'
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 }
  }));

  allChildren.push(new Paragraph({
    children: [new TextRun({
      text: 'Developed by mastree.co.in',
      size: 20,
      color: '2E75B6',
      bold: true
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }));

  allChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // Build sections for each row
  for (let i = 0; i < auditTrails.length; i++) {
    const rowChildren = buildRowSection(
      auditTrails[i],
      outputRows[i] || [],
      headers,
      i + 1,
      i === auditTrails.length - 1
    );
    allChildren.push(...rowChildren);
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: allChildren
    }]
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateFullAuditDocx };
