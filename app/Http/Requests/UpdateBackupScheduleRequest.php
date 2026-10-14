<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBackupScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'developer';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'frequency' => ['required', 'string', 'in:weekly,monthly'],
            'day' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) {
                    if ($this->input('frequency') === 'weekly' && ($value < 0 || $value > 6)) {
                        $fail('For weekly schedules, day must be between 0 (Sunday) and 6 (Saturday).');
                    }
                    if ($this->input('frequency') === 'monthly' && ($value < 1 || $value > 31)) {
                        $fail('For monthly schedules, day must be between 1 and 31.');
                    }
                },
            ],
            'time' => ['required', 'string', 'regex:/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/'],
            'is_enabled' => ['required', 'boolean'],
        ];
    }
}
