// 游戏状态管理
class RouletteGame {
    constructor() {
        this.totalBullets = 0;
        this.initialReal = 0;
        this.initialBlank = 0;
        this.remainingReal = 0;
        this.remainingBlank = 0;
        this.bullets = []; // 子弹数组，每个元素包含 type: 'real' | 'blank' | 'unknown', known: boolean
        this.usedBullets = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateInputListeners();
    }

    setupEventListeners() {
        // 开始游戏按钮
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });

        // 自定义弹窗事件
        document.getElementById('customModalClose').addEventListener('click', () => {
            this.hideCustomModal();
        });

        document.getElementById('customModalCancel').addEventListener('click', () => {
            this.hideCustomModal();
        });

        document.getElementById('customModalConfirm').addEventListener('click', () => {
            this.confirmCustomModal();
        });

        // 点击弹窗外部关闭
        document.getElementById('customModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('customModal')) {
                this.hideCustomModal();
            }
        });

        // 消耗子弹按钮
        document.getElementById('useRealBullet').addEventListener('click', () => {
            this.useBullet('real');
        });

        document.getElementById('useBlankBullet').addEventListener('click', () => {
            this.useBullet('blank');
        });

        // 道具按钮
        document.getElementById('magnifier').addEventListener('click', () => {
            this.showMagnifierTool();
        });

        document.getElementById('phone').addEventListener('click', () => {
            this.showPhoneTool();
        });

        // 重新开始按钮
        document.getElementById('resetGame').addEventListener('click', () => {
            this.resetGame();
        });
    }

    updateInputListeners() {
        const realInput = document.getElementById('realBullets');
        const blankInput = document.getElementById('blankBullets');
        const totalDisplay = document.getElementById('totalBulletsDisplay');
        const realPicker = document.getElementById('realBulletsPicker');
        const blankPicker = document.getElementById('blankBulletsPicker');

        // 初始化不显示选中状态
        this.updateNumberPicker(realPicker, null);
        this.updateNumberPicker(blankPicker, null);

        // 真弹数字按钮事件
        realPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('number-btn')) {
                const value = parseInt(e.target.dataset.value);
                realInput.value = value;
                this.updateNumberPicker(realPicker, value);
                this.updateTotalDisplay();
            }
        });

        // 假弹数字按钮事件
        blankPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('number-btn')) {
                const value = parseInt(e.target.dataset.value);
                blankInput.value = value;
                this.updateNumberPicker(blankPicker, value);
                this.updateTotalDisplay();
            }
        });
    }

    updateNumberPicker(picker, selectedValue) {
        // 移除所有选中状态
        picker.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 添加选中状态（仅当有值时）
        if (selectedValue !== null && selectedValue !== undefined && selectedValue !== '') {
            const selectedBtn = picker.querySelector(`[data-value="${selectedValue}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('selected');
            }
        }
    }

    updateTotalDisplay() {
        const realInput = document.getElementById('realBullets');
        const blankInput = document.getElementById('blankBullets');
        const totalDisplay = document.getElementById('totalBulletsDisplay');

        const real = parseInt(realInput.value) || 0;
        const blank = parseInt(blankInput.value) || 0;
        const total = real + blank;

        totalDisplay.textContent = total;
    }

    startGame() {
        const real = parseInt(document.getElementById('realBullets').value);
        const blank = parseInt(document.getElementById('blankBullets').value);

        // 验证输入
        if (isNaN(real) || isNaN(blank) || real === 0 || blank === 0) {
            this.showCustomModal(
                '⚠️',
                '选择错误',
                '请先选择真弹和假弹的数量（至少各1发）！'
            );
            return;
        }

        const total = real + blank;

        if (total > 10) {
            this.showCustomModal(
                '⚠️',
                '数量超限',
                '每种子弹数量最多10发，总计不超过10发！'
            );
            return;
        }

        this.totalBullets = total;
        this.initialReal = real;
        this.initialBlank = blank;
        this.remainingReal = real;
        this.remainingBlank = blank;
        this.usedBullets = 0;

        // 初始化子弹数组
        this.bullets = [];
        for (let i = 0; i < total; i++) {
            this.bullets.push({
                type: 'unknown',
                known: false,
                revealed: false,
                used: false
            });
        }

        // 强制切换面板 - 确保完全隐藏设置面板
        const setupPanel = document.getElementById('setupPanel');
        const gamePanel = document.getElementById('gamePanel');

        setupPanel.style.display = 'none';
        setupPanel.style.visibility = 'hidden';
        setupPanel.style.position = 'absolute';
        setupPanel.style.top = '-9999px';

        gamePanel.style.display = 'block';
        gamePanel.style.visibility = 'visible';
        gamePanel.style.position = 'relative';
        gamePanel.style.top = 'auto';

        this.updateDisplay();
    }

    useBullet(type) {
        if (type === 'real' && this.remainingReal <= 0) {
            this.showCustomModal(
                '🔫',
                '没有真弹',
                '没有剩余的真弹了！'
            );
            return;
        }
        if (type === 'blank' && this.remainingBlank <= 0) {
            this.showCustomModal(
                '🔫',
                '没有假弹',
                '没有剩余的假弹了！'
            );
            return;
        }

        // 找到第一个未消耗的子弹位置（严格按照从左到右的顺序）
        let targetIndex = -1;
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            // 找到第一个未使用的子弹
            if (!bullet.used) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex !== -1) {
            const nextBullet = this.bullets[targetIndex];

            // 如果下一个子弹的类型已知且与用户选择不符，阻止操作
            if (nextBullet.known && nextBullet.type !== type) {
                const actualType = nextBullet.type === 'real' ? '真弹' : '假弹';
                const userType = type === 'real' ? '真弹' : '假弹';
                this.showCustomModal(
                    '⚠️',
                    '类型不匹配',
                    `下一发子弹是${actualType}，不能选择射出${userType}！`
                );
                return;
            }

            // 消耗子弹，使用实际类型（如果已知）或用户选择的类型
            const actualType = nextBullet.known ? nextBullet.type : type;

            this.bullets[targetIndex] = {
                type: actualType,
                known: true,
                revealed: false, // 被消耗时不再是预测状态
                used: true // 标记为已消耗
            };

            if (actualType === 'real') {
                this.remainingReal--;
            } else {
                this.remainingBlank--;
            }
            this.usedBullets++;
        } else {
            this.showCustomModal(
                '⚠️',
                '错误',
                '没有找到合适的子弹位置！'
            );
            return;
        }

        this.updateDisplay();
    }

      showMagnifierTool() {
        // 找到当前真正的下一发子弹（未消耗的第一个）
        const nextBulletIndex = this.bullets.findIndex(b => !b.used);

        if (nextBulletIndex === -1) {
            this.showCustomModal(
                '🔍',
                '无法使用',
                '没有剩余子弹了！'
            );
            return;
        }

        const nextBullet = this.bullets[nextBulletIndex];

        // 如果下一发已经知道类型，直接提示
        if (nextBullet.known) {
            const bulletType = nextBullet.type === 'real' ? '真弹 🔴' : '假弹 🔵';
            const status = nextBullet.revealed ? '（已被查看过）' : '（类型已知）';
            this.showCustomModal(
                '🔍',
                '下一发子弹',
                `<p>下一发子弹已经是<strong>${bulletType}</strong>${status}</p>
                 <p>无需使用放大镜查看。</p>`,
                null, // 不需要确认回调
                false // 只显示确定按钮
            );
            return;
        }

        this.showCustomModal(
            '🔍',
            '放大镜 - 查看下一发',
            `
            <p>放大镜可以让你知道下一发子弹的类型</p>
            <div class="radio-group">
                <label class="radio-label">
                    <input type="radio" name="magnifierType" value="real" required>
                    <span style="color: #ff4444;">真弹 🔴</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="magnifierType" value="blank" required>
                    <span style="color: #4444ff;">假弹 🔵</span>
                </label>
            </div>
            `,
            () => this.applyMagnifier(nextBulletIndex)
        );
    }

    applyMagnifier(targetIndex) {
        const selectedType = document.querySelector('input[name="magnifierType"]:checked');
        if (!selectedType) {
            this.showCustomModal(
                '🔍',
                '选择类型',
                '请选择下一发子弹类型！'
            );
            return;
        }

        const type = selectedType.value;

        // 更新指定位置的子弹类型
        this.bullets[targetIndex] = {
            type: type,
            known: true,
            revealed: true, // 标记为已揭示但未消耗
            used: false // 未消耗
        };

        // 显示查看结果
        const bulletType = type === 'real' ? '真弹 🔴' : '假弹 🔵';
        const bulletPosition = targetIndex + 1;

        this.hideCustomModal();

        this.showCustomModal(
            '🔍',
            '查看结果',
            `<p>第 <strong>${bulletPosition}</strong> 发子弹是<strong>${bulletType}</strong></p>
             <p>这个信息已经记录，可以正常使用道具或射击。</p>`,
            null, // 不需要确认回调
            false // 只显示确定按钮
        );

        this.updateDisplay();
    }

    showPhoneTool() {
        // 获取所有剩余的子弹（未消耗的子弹）
        const remainingBullets = [];
        let remainingCount = 0;
        this.bullets.forEach((bullet, index) => {
            if (!bullet.used) {
                remainingCount++;
                remainingBullets.push({
                    originalIndex: index,
                    remainingPosition: remainingCount, // 在剩余子弹中的位置
                    bullet: bullet
                });
            }
        });

        if (remainingBullets.length === 0) {
            this.showCustomModal(
                '📱',
                '无法使用',
                '没有剩余子弹了！'
            );
            return;
        }

        // 检查是否还有未知的剩余子弹
        const unknownRemainingBullets = remainingBullets.filter(item => !item.bullet.known);
        if (unknownRemainingBullets.length === 0) {
            this.showCustomModal(
                '📱',
                '无法使用',
                '所有剩余子弹的类型都已知道了！'
            );
            return;
        }

        const phoneContent = `
            <p>手机可以让你知道剩余子弹中第n发的类型</p>
            <label>选择剩余子弹位置：</label>
            <select class="modal-select" id="bulletPosition">
                ${remainingBullets.map(item => {
                    const status = item.bullet.known ?
                        (item.bullet.revealed ? '（已查看）' : '（已知）') :
                        '（未知）';
                    return `<option value="${item.originalIndex}">剩余第 ${item.remainingPosition} 发 ${status}</option>`;
                }).join('')}
            </select>
            <div class="radio-group">
                <label class="radio-label">
                    <input type="radio" name="phoneType" value="real" required>
                    <span style="color: #ff4444;">真弹 🔴</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="phoneType" value="blank" required>
                    <span style="color: #4444ff;">假弹 🔵</span>
                </label>
            </div>
        `;

        this.showCustomModal(
            '📱',
            '手机 - 预测剩余第n发',
            phoneContent,
            () => this.applyPhone()
        );
    }

    applyPhone() {
        const originalIndex = parseInt(document.getElementById('bulletPosition').value);
        const selectedType = document.querySelector('input[name="phoneType"]:checked');
        const selectedBullet = this.bullets[originalIndex];

        if (!selectedType) {
            this.showCustomModal(
                '📱',
                '选择类型',
                '请选择子弹类型！'
            );
            return;
        }

        // 如果选择的子弹已经知道类型，直接提示
        if (selectedBullet.known) {
            const bulletType = selectedBullet.type === 'real' ? '真弹 🔴' : '假弹 🔵';
            const bulletNumber = originalIndex + 1;

            // 计算这是剩余第几发
            let remainingPosition = 0;
            for (let i = 0; i <= originalIndex; i++) {
                if (!this.bullets[i].used) {
                    remainingPosition++;
                }
            }

            this.hideCustomModal();

            this.showCustomModal(
                '📱',
                '已知信息',
                `<p>剩余第 <strong>${remainingPosition}</strong> 发（总第${bulletNumber}发）已经是<strong>${bulletType}</strong></p>
                 <p>无需使用手机查看。</p>`,
                null,
                false
            );
            return;
        }

        const type = selectedType.value;

        // 更新子弹信息
        this.bullets[originalIndex] = {
            type: type,
            known: true,
            revealed: true, // 标记为已揭示但未消耗
            used: false // 未消耗
        };

        // 计算这是剩余第几发
        let remainingPosition = 0;
        for (let i = 0; i <= originalIndex; i++) {
            if (!this.bullets[i].used) {
                remainingPosition++;
            }
        }

        // 显示查看结果
        const bulletType = type === 'real' ? '真弹 🔴' : '假弹 🔵';
        const bulletNumber = originalIndex + 1;

        this.hideCustomModal();

        this.showCustomModal(
            '📱',
            '查看结果',
            `<p>剩余第 <strong>${remainingPosition}</strong> 发（总第${bulletNumber}发）是<strong>${bulletType}</strong></p>
             <p>这个信息已经记录，可以正常使用道具或射击。</p>`,
            null,
            false
        );

        this.updateDisplay();
    }

    
    resetGame() {
        this.showCustomModal(
            '⚠️',
            '重新开始',
            '确定要重新开始吗？当前游戏进度将丢失。',
            () => {
                // 确认后重置游戏
                const setupPanel = document.getElementById('setupPanel');
                const gamePanel = document.getElementById('gamePanel');

                // 重置设置面板状态
                setupPanel.style.display = 'block';
                setupPanel.style.visibility = 'visible';
                setupPanel.style.position = 'relative';
                setupPanel.style.top = 'auto';

                // 隐藏游戏面板
                gamePanel.style.display = 'none';
                gamePanel.style.visibility = 'hidden';
                gamePanel.style.position = 'absolute';
                gamePanel.style.top = '-9999px';

                // 重置所有输入
                document.getElementById('realBullets').value = '';
                document.getElementById('blankBullets').value = '';
                document.getElementById('totalBulletsDisplay').textContent = '0';

                // 清除选中状态
                this.updateNumberPicker(document.getElementById('realBulletsPicker'), null);
                this.updateNumberPicker(document.getElementById('blankBulletsPicker'), null);

                            }
        );
    }

    getRemainingUnknownCount() {
        return this.bullets.filter(b => !b.known).length;
    }

    updateDisplay() {
        this.updateStats();
        this.updateChamber();
        this.updateProbability();
        this.updateNextBulletPreview();
        this.updateActionButtons();
    }

    updateStats() {
        document.getElementById('remainingReal').textContent = this.remainingReal;
        document.getElementById('remainingBlank').textContent = this.remainingBlank;
        document.getElementById('remainingTotal').textContent = this.remainingReal + this.remainingBlank;
    }

    updateNextBulletPreview() {
        const preview = document.getElementById('nextBulletPreview');

        // 找到下一个未消耗的子弹
        let nextBullet = null;
        for (let i = 0; i < this.bullets.length; i++) {
            if (!this.bullets[i].used) {
                nextBullet = this.bullets[i];
                break;
            }
        }

        if (!nextBullet) {
            preview.innerHTML = '<span style="color: #888;">没有剩余子弹</span>';
        } else if (nextBullet.known) {
            // 子弹类型直接已知（通过道具预测）
            const bulletIcon = nextBullet.type === 'real' ? '🔴 真弹' : '🔵 假弹';
            const status = nextBullet.revealed ? '（已预测）' : '';
            preview.innerHTML = `<span style="color: ${nextBullet.type === 'real' ? '#ff4444' : '#4444ff'};">下一发：${bulletIcon}${status}</span>`;
        } else {
            // 子弹类型未知，检查是否可以通过排除法确定
            const totalRemaining = this.remainingReal + this.remainingBlank;

            if (this.remainingReal === 0) {
                // 剩余全是假弹
                preview.innerHTML = '<span style="color: #4444ff;">下一发：🔵 假弹（确定）</span>';
            } else if (this.remainingBlank === 0) {
                // 剩余全是真弹
                preview.innerHTML = '<span style="color: #ff4444;">下一发：🔴 真弹（确定）</span>';
            } else {
                // 确实未知
                preview.innerHTML = '<span style="color: #fff;">下一发：未知</span>';
            }
        }
    }

    updateChamber() {
        const chamber = document.getElementById('chamber');
        chamber.innerHTML = '';

        this.bullets.forEach((bullet, index) => {
            const slot = document.createElement('div');
            slot.className = 'bullet-slot';

            if (bullet.used) {
                // 已消耗的子弹
                if (bullet.type === 'real') {
                    slot.classList.add('real');
                    slot.innerHTML = '💥'; // 已射出的真弹
                } else {
                    slot.classList.add('blank');
                    slot.innerHTML = '💥'; // 已射出的假弹
                }
            } else if (bullet.revealed && bullet.known) {
                // 已预测但未消耗的子弹
                if (bullet.type === 'real') {
                    slot.classList.add('revealed-real');
                    slot.innerHTML = '👁️🔴'; // 已揭示的真弹
                } else {
                    slot.classList.add('revealed-blank');
                    slot.innerHTML = '👁️🔵'; // 已揭示的假弹
                }
            } else {
                // 未知的子弹
                slot.classList.add('unknown');
                slot.innerHTML = '❓';
            }

            // 添加位置标记
            const indexLabel = document.createElement('div');
            indexLabel.className = 'bullet-index';
            indexLabel.textContent = index + 1;
            slot.appendChild(indexLabel);

            chamber.appendChild(slot);
        });
    }

    updateProbability() {
        const overallProbability = document.getElementById('overallProbability');
        const nextProbability = document.getElementById('nextProbability');
        const positionProbability = document.getElementById('positionProbability');

        overallProbability.innerHTML = '';
        nextProbability.innerHTML = '';
        positionProbability.innerHTML = '';

        // 计算已预测但未消耗的子弹数量，以及未知子弹数量
        let revealedReal = 0;
        let revealedBlank = 0;
        let unknownCount = 0;

        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            if (!bullet.used) {
                // 未消耗的子弹
                if (bullet.revealed && bullet.known) {
                    // 已预测但未消耗
                    if (bullet.type === 'real') {
                        revealedReal++;
                    } else {
                        revealedBlank++;
                    }
                } else if (!bullet.known) {
                    // 完全未知
                    unknownCount++;
                }
            }
        }

        const totalRemaining = this.remainingReal + this.remainingBlank;
        const totalUnknownRemaining = unknownCount;

        if (totalRemaining === 0) {
            overallProbability.innerHTML = '<p style="text-align: center; font-size: 1.2rem;">所有子弹都已消耗！</p>';
            nextProbability.innerHTML = '<p style="text-align: center; font-size: 1.2rem;">没有剩余子弹</p>';
            positionProbability.innerHTML = '<p style="text-align: center; font-size: 1.2rem;">没有剩余位置</p>';
            return;
        }

        // 剩余未预测子弹的数量
        const remainingUnknownReal = this.remainingReal - revealedReal;
        const remainingUnknownBlank = this.remainingBlank - revealedBlank;

        // 总体概率（包含已预测的）
        const overallRealProb = (this.remainingReal / totalRemaining) * 100;
        const overallBlankProb = (this.remainingBlank / totalRemaining) * 100;

        overallProbability.innerHTML = `
            <div class="overall-probability">
                <div class="probability-item">
                    <div class="probability-bar ${overallRealProb === 0 ? 'probability-bar-zero' : ''}">
                        ${overallRealProb === 0
                            ? `<div class="probability-fill probability-fill-zero" style="width: 100%"></div>`
                            : `<div class="probability-fill probability-real" style="width: ${overallRealProb}%"></div>`
                        }
                        <div class="probability-text">${overallRealProb === 0 ? '0%' : overallRealProb.toFixed(1) + '%'} 🔴</div>
                    </div>
                    <div class="probability-text">
                        真弹: ${this.remainingReal}/${totalRemaining}
                    </div>
                </div>
                <div class="probability-item">
                    <div class="probability-bar ${overallBlankProb === 0 ? 'probability-bar-zero' : ''}">
                        ${overallBlankProb === 0
                            ? `<div class="probability-fill probability-fill-zero" style="width: 100%"></div>`
                            : `<div class="probability-fill probability-blank" style="width: ${overallBlankProb}%"></div>`
                        }
                        <div class="probability-text">${overallBlankProb === 0 ? '0%' : overallBlankProb.toFixed(1) + '%'} 🔵</div>
                    </div>
                    <div class="probability-text">
                        假弹: ${this.remainingBlank}/${totalRemaining}
                    </div>
                </div>
            </div>
        `;

        // 下一发概率（如果是已预测的，显示确定性；否则显示剩余未预测的概率）
        let nextRealProb, nextBlankProb;
        let nextBullet = null;

        // 找到下一个未消耗的子弹
        for (let i = 0; i < this.bullets.length; i++) {
            if (!this.bullets[i].used) {
                nextBullet = this.bullets[i];
                break;
            }
        }

        if (nextBullet && nextBullet.revealed && nextBullet.known) {
            // 下一发已经被预测
            if (nextBullet.type === 'real') {
                nextRealProb = 100;
                nextBlankProb = 0;
            } else {
                nextRealProb = 0;
                nextBlankProb = 100;
            }
        } else if (totalUnknownRemaining > 0) {
            // 下一发未预测，基于剩余未预测子弹计算
            nextRealProb = (remainingUnknownReal / totalUnknownRemaining) * 100;
            nextBlankProb = (remainingUnknownBlank / totalUnknownRemaining) * 100;
        } else {
            nextRealProb = nextBlankProb = 0;
        }

        nextProbability.innerHTML = `
            <div class="next-probability">
                <div class="probability-item">
                    <div class="probability-bar ${nextRealProb === 0 ? 'probability-bar-zero' : ''}">
                        ${nextRealProb === 0
                            ? `<div class="probability-fill probability-fill-zero" style="width: 100%"></div>`
                            : `<div class="probability-fill probability-real" style="width: ${nextRealProb}%"></div>`
                        }
                        <div class="probability-text">${nextRealProb === 0 ? '0%' : nextRealProb.toFixed(1) + '%'} 🔴</div>
                    </div>
                    <div class="probability-text">
                        下一发真弹概率
                    </div>
                </div>
                <div class="probability-item">
                    <div class="probability-bar ${nextBlankProb === 0 ? 'probability-bar-zero' : ''}">
                        ${nextBlankProb === 0
                            ? `<div class="probability-fill probability-fill-zero" style="width: 100%"></div>`
                            : `<div class="probability-fill probability-blank" style="width: ${nextBlankProb}%"></div>`
                        }
                        <div class="probability-text">${nextBlankProb === 0 ? '0%' : nextBlankProb.toFixed(1) + '%'} 🔵</div>
                    </div>
                    <div class="probability-text">
                        下一发假弹概率
                    </div>
                </div>
            </div>
        `;

        // 各位置概率
        const positionCards = [];
        let remainingCount = 0;

        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];

            // 只显示未消耗的子弹（不管是未知还是已预测的）
            if (!bullet.known || bullet.revealed) {
                remainingCount++;
                const card = document.createElement('div');
                card.className = 'probability-card';

                // 如果这个位置已经被预测过，显示确定的结果
                if (bullet.revealed && bullet.known) {
                    if (bullet.type === 'real') {
                        card.innerHTML = `
                            <h4>第 ${i + 1} 发 (剩余第${remainingCount}发) 📱</h4>
                            <div class="probability-bar">
                                <div class="probability-fill probability-real" style="width: 100%"></div>
                                <div class="probability-text">100% 🔴 (已预测)</div>
                            </div>
                            <div class="probability-text">
                                确定为真弹
                            </div>
                        `;
                    } else {
                        card.innerHTML = `
                            <h4>第 ${i + 1} 发 (剩余第${remainingCount}发) 📱</h4>
                            <div class="probability-bar">
                                <div class="probability-fill probability-blank" style="width: 100%"></div>
                                <div class="probability-text">100% 🔵 (已预测)</div>
                            </div>
                            <div class="probability-text">
                                确定为假弹
                            </div>
                        `;
                    }
                } else if (totalUnknownRemaining > 0) {
                    // 未预测的位置，基于剩余未预测子弹计算概率
                    const realProb = (remainingUnknownReal / totalUnknownRemaining) * 100;
                    const blankProb = (remainingUnknownBlank / totalUnknownRemaining) * 100;

                    card.innerHTML = `
                        <h4>第 ${i + 1} 发 (剩余第${remainingCount}发)</h4>
                        <div class="probability-bar ${realProb === 0 ? 'probability-bar-zero' : ''}">
                            ${realProb === 0
                                ? `<div class="probability-fill probability-fill-zero" style="width: 100%"></div>`
                                : `<div class="probability-fill probability-real" style="width: ${realProb}%"></div>`
                            }
                            <div class="probability-text">${realProb === 0 ? '0%' : realProb.toFixed(1) + '%'} 🔴</div>
                        </div>
                        <div class="probability-bar ${blankProb === 0 ? 'probability-bar-zero' : ''}" style="margin-top: 5px;">
                            ${blankProb === 0
                                ? `<div class="probability-fill probability-fill-zero" style="width: 100%"></div>`
                                : `<div class="probability-fill probability-blank" style="width: ${blankProb}%"></div>`
                            }
                            <div class="probability-text">${blankProb === 0 ? '0%' : blankProb.toFixed(1) + '%'} 🔵</div>
                        </div>
                    `;
                } else {
                    // 没有未预测的子弹了
                    card.innerHTML = `
                        <h4>第 ${i + 1} 发 (剩余第${remainingCount}发)</h4>
                        <div class="probability-text" style="text-align: center; margin-top: 20px;">
                            所有剩余子弹类型已知
                        </div>
                    `;
                }
                positionCards.push(card);
            }
        }

        positionCards.forEach(card => positionProbability.appendChild(card));
    }

    updateActionButtons() {
        const realButton = document.getElementById('useRealBullet');
        const blankButton = document.getElementById('useBlankBullet');

        // 找到下一个未消耗的子弹
        let nextBullet = null;
        for (let i = 0; i < this.bullets.length; i++) {
            if (!this.bullets[i].used) {
                nextBullet = this.bullets[i];
                break;
            }
        }

        if (nextBullet) {
            // 如果下一发子弹类型已知，禁用不符合的按钮
            if (nextBullet.known) {
                if (nextBullet.type === 'real') {
                    realButton.disabled = false;
                    realButton.style.opacity = '1';
                    realButton.style.cursor = 'pointer';

                    blankButton.disabled = true;
                    blankButton.style.opacity = '0.5';
                    blankButton.style.cursor = 'not-allowed';
                } else {
                    blankButton.disabled = false;
                    blankButton.style.opacity = '1';
                    blankButton.style.cursor = 'pointer';

                    realButton.disabled = true;
                    realButton.style.opacity = '0.5';
                    realButton.style.cursor = 'not-allowed';
                }
            } else {
                // 下一发类型未知，两个按钮都可用
                realButton.disabled = false;
                realButton.style.opacity = '1';
                realButton.style.cursor = 'pointer';

                blankButton.disabled = false;
                blankButton.style.opacity = '1';
                blankButton.style.cursor = 'pointer';
            }
        } else {
            // 没有剩余子弹，两个按钮都禁用
            realButton.disabled = true;
            realButton.style.opacity = '0.5';
            realButton.style.cursor = 'not-allowed';

            blankButton.disabled = true;
            blankButton.style.opacity = '0.5';
            blankButton.style.cursor = 'not-allowed';
        }
    }

    // 自定义弹窗方法
    showCustomModal(icon, title, message, onConfirm = null, showCancel = true) {
        const modal = document.getElementById('customModal');
        const modalIcon = modal.querySelector('.custom-modal-icon');
        const modalTitle = document.getElementById('customModalTitle');
        const modalMessage = document.getElementById('customModalMessage');
        const modalCancel = document.getElementById('customModalCancel');
        const modalConfirm = document.getElementById('customModalConfirm');

        // 现在只使用emoji图标
        modalIcon.className = 'custom-modal-icon';
        modalIcon.textContent = icon || '⚠️';
        modalTitle.textContent = title;

        // 检查message是否包含HTML标签
        if (message.includes('<') && message.includes('>')) {
            modalMessage.innerHTML = message;
        } else {
            modalMessage.textContent = message;
        }

        // 存储确认回调
        this.customModalConfirmCallback = onConfirm;

        // 控制取消按钮的显示
        if (showCancel) {
            modalCancel.style.display = 'inline-flex';
            modalConfirm.textContent = '确定';
        } else {
            modalCancel.style.display = 'none';
            modalConfirm.textContent = '确定';
        }

        modal.style.display = 'flex';
    }

    hideCustomModal() {
        const modal = document.getElementById('customModal');
        modal.style.display = 'none';
        this.customModalConfirmCallback = null;
    }

    confirmCustomModal() {
        if (this.customModalConfirmCallback) {
            this.customModalConfirmCallback();
        }
        this.hideCustomModal();
    }
}


// 全屏管理器
class FullscreenManager {
    constructor() {
        this.fullscreenBtn = document.getElementById('fullscreenToggle');
        this.isFullscreen = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 全屏按钮点击事件
        this.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 监听全屏状态变化
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenStatus();
        });

        document.addEventListener('webkitfullscreenchange', () => {
            this.updateFullscreenStatus();
        });

        document.addEventListener('mozfullscreenchange', () => {
            this.updateFullscreenStatus();
        });

        document.addEventListener('MSFullscreenChange', () => {
            this.updateFullscreenStatus();
        });
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        const element = document.documentElement;

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    updateFullscreenStatus() {
        this.isFullscreen = !!(document.fullscreenElement ||
                              document.webkitFullscreenElement ||
                              document.mozFullScreenElement ||
                              document.msFullscreenElement);

        if (this.isFullscreen) {
            this.fullscreenBtn.textContent = '🔲 退出';
        } else {
            this.fullscreenBtn.textContent = '🔳 全屏';
        }
    }

    // 检查是否支持全屏
    isFullscreenSupported() {
        return !!(document.documentElement.requestFullscreen ||
                  document.documentElement.webkitRequestFullscreen ||
                  document.documentElement.mozRequestFullScreen ||
                  document.documentElement.msRequestFullscreen);
    }
}

// 初始化游戏
let game;
let fullscreenManager;

document.addEventListener('DOMContentLoaded', () => {
    game = new RouletteGame();
    fullscreenManager = new FullscreenManager();

    // 如果不支持全屏，隐藏按钮
    if (!fullscreenManager.isFullscreenSupported()) {
        document.getElementById('fullscreenToggle').style.display = 'none';
    }
});