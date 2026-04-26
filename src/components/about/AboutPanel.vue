<script setup lang="ts"></script>

<template>
  <div class="about-panel">
    <div class="about-section">
      <h2 class="about-title">关于编辑器</h2>
      <p class="about-description">
        这是一款功能强大的在线编辑器，支持多种文件格式的编辑和管理。
        提供简洁直观的用户界面，帮助您高效地完成文档编辑工作。
      </p>
    </div>

    <div class="about-section">
      <h2 class="about-title">免责声明</h2>
      <div class="disclaimer-content">
        <p>
          <strong>数据隐私保护：</strong>
          本编辑器的所有数据均保存在本地 IndexedDB/LocalStorage/Cookies
          数据库中，不会上传到任何外部服务器。
          您的数据完全由您自己控制，我们不会收集、存储或共享您的任何个人信息。
        </p>
        <p>
          <strong>第三方编辑器：</strong>
          本编辑器集成了第三方编辑器，这些编辑器的使用和数据处理由其各自的所有者负责。
        </p>
        <p>
          <strong>使用风险：</strong>
          尽管我们致力于提供稳定可靠的服务，但用户应自行承担使用本编辑器的风险。
          建议定期备份重要数据，以防意外丢失。
        </p>
        <p>
          <strong>开源许可：</strong>
          本编辑器采用开源许可，用户可以自由使用、修改和分发代码。
          请遵守相应的开源协议条款。
        </p>
      </div>
    </div>

    <div class="about-section">
      <h2 class="about-title">联系我们</h2>
      <div class="contact-content">
        <p>如果您有任何问题、建议或发现 Bug，欢迎通过以下方式联系我们：</p>
        <a
          href="https://github.com/iss-tools/editor-main"
          target="_blank"
          rel="noopener noreferrer"
          class="github-link"
        >
          <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          GitHub 仓库
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-panel {
  padding: 20px;
  max-width: 600px;
  color: var(--text);
}

.about-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.about-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text);
}

.about-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.disclaimer-content {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-secondary);

  p {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: var(--text);
    font-weight: 600;
  }
}

.contact-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);

  p {
    margin-bottom: 12px;
  }
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--btn-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: var(--btn-hover);
    border-color: var(--primary);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.github-icon {
  width: 20px;
  height: 20px;
}
</style>
