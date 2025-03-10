from typing import Any, Dict
from pathlib import Path

import frontmatter
from jinja2 import Environment, TemplateError, StrictUndefined, FileSystemLoader, meta


def get_root_project():
    return Path(__file__).parent.parent


class PromptManager:
    def __init__(self, template_dir: str = 'prompts/templates'):
        self.template_dir = Path(get_root_project()) / template_dir

        if not self.template_dir.exists():
            raise FileNotFoundError(
                f'Template directory not found: {self.template_dir}'
            )

        self.env = Environment(
            loader=FileSystemLoader(self.template_dir),
            undefined=StrictUndefined,
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def _normalize_template_dir(self, template: str) -> str:
        return f'{template}.j2' if not template.endswith('.j2') else template

    def _load_template(self, template_path: str) -> frontmatter.Post:
        try:
            file_path = self.env.loader.get_source(self.env, template_path)[1]  # type: ignore
            with open(file_path, encoding='utf-8') as f_in:
                return frontmatter.load(f_in)
        except IOError as err:
            raise IOError(f'Failed to load template {template_path}') from err

    def get_prompt(self, template: str, **kwargs: Any) -> str:
        template_path = self._normalize_template_dir(template)
        post = self._load_template(template_path)

        try:
            template_obj = self.env.from_string(post.content)
            return template_obj.render(**kwargs)
        except TemplateError as err:
            raise ValueError(f'Error rendering template: {err}') from err

    def get_template_info(self, template: str) -> Dict[str, Any]:
        template_path = self._normalize_template_dir(template)
        post = self._load_template(template_path)

        parset_content = self.env.parse(post.content)
        variables = meta.find_undeclared_variables(parset_content)
        meta_data = post.metadata

        meta_data['placeholders'] = variables

        return meta_data
